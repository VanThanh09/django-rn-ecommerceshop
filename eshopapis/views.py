from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
import cloudinary.api

from eshopapis.models import Product, Store, User, VerificationSeller, ProductVariant, Attribute, AttributeValue
from eshopapis import serializers, perms


# Hàm để xóa ảnh từ Cloudinary
def delete_image_from_cloudinary(image_url):
    # Trích xuất public ID từ URL của Cloudinary
    public_id = image_url.split('/')[-1].split('.')[0]  # Tách public ID từ URL

    try:
        image_delete_result = cloudinary.api.delete_resources(public_id, resource_type="image", type="upload")
        print(image_delete_result)
    except Exception as e:
        print(f"Không thể xóa ảnh: {e}")


# Create new user
class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True).all()
    serializer_class = serializers.UserSerializer


# Return list of all product
class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Product.objects.filter(active=True)
    serializer_class = serializers.ProductSerializer


# Return detail of product ( all variant of product)
class ProductDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True)
    serializer_class = serializers.ProductDetailSerializer


# Add new product and variants of this
class ProductCreateViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = Product.objects.filter(active=True).all()
    serializer_class = serializers.ProductCreateSerializer
    permission_classes = [perms.IsSeller]  # Just for seller

    def create(self, request, *args, **kwargs):
        """
        Lấy dữ liệu từ request
        Gắn store tương ứng với người dùng hiện tại
        Tạo sản phẩm
        Xử lý danh sách biến thể (variants) của sản phẩm
        Tạo và gắn các thuộc tính cho từng biến thể
        """
        data = request.data.copy()
        # Lấy store của user gửi request
        store = Store.objects.filter(owner=self.request.user).first()

        # Dữ liệu mặc định hợp lệ
        default_data = {
            "store": store.id,
            'productvariant_set': [],  # Để trống để lưu product trước làm khóa ngoại cho product_variant
        }

        # Thêm default data và data để lưu trước
        for field, default_value in default_data.items():
            if field not in data:
                data[field] = default_value

        serializer = self.get_serializer(data=data)  # bọc dữ liệu vào serializer để kiểm tra
        serializer.is_valid(raise_exception=True)  # Kiểm tra dữ liệu hợp lệ không
        product = serializer.save()  # Hợp lệ rồi thì lưu dữ liệu ( create product)

        variants = data.pop("variants")  # Lấy toàn bộ variants ra
        for variant in variants:
            attributes = []

            attrs = variant.pop("attributes") # lấy từng attribute value ra để lưu
            for attr in attrs:
                attr_obj, _ = Attribute.objects.get_or_create(
                    name=attr["name"])  # return (<Attribute: name>, True/False)
                attr_value, _ = AttributeValue.objects.get_or_create(
                    value=attr["value"],
                    attribute=attr_obj,
                )  # return (<AttributeValue: value>, True/False)

                attributes.append(attr_value.id)

            product_variant = ProductVariant.objects.create(
                quantity=variant["quantity"],
                price=variant["price"],
                product=product,
            )
            product_variant.attributes.set(attributes)

            product.productvariant_set.add(product_variant)

        product.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Return a store detail
class StoreDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Store.objects.filter(active=True)
    serializer_class = serializers.StoreSerializer

    # Return all product of a store
    @action(methods=['get'], detail=True, url_path='products')
    def get_products(self, request, pk):
        products = self.get_object().product_set.filter(active=True)

        return Response(serializers.ProductSerializer(products, many=True).data, status=status.HTTP_200_OK)


# POST api for customer want to become seller
class VerificationSellerViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = VerificationSeller.objects.all()
    serializer_class = serializers.VerificationSellerSerializer

    def get_permissions(self):
        if self.action == 'create':
            # Only role CUSTOMER can send post request (POST)
            return [perms.IsCustomer()]
        elif self.action == 'list':
            # Only role EMPLOYEE can send get request (GET)
            return [perms.IsEmployee()]

    # one customer must send request one time
    def create(self, request, *args, **kwargs):
        user = self.request.user
        if VerificationSeller.objects.filter(user=user, status='RE').exists():
            obj = VerificationSeller.objects.filter(user=user, status='RE').first()
            image_url = obj.temp_store_logo.url
            # Gọi hàm xóa ảnh từ Cloudinary
            delete_image_from_cloudinary(image_url)
            obj.delete()
        if VerificationSeller.objects.filter(user=user, status='PE').exists():
            return Response({"detail": "The request already exists."}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    # save the request with user send request
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# PATCH API for employee accept or reject the request become seller
class ActionVerificationViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView):
    queryset = VerificationSeller.objects.filter(status='PE')
    serializer_class = serializers.VerificationSellerSerializer
    permission_classes = [perms.IsEmployee]

    @action(methods=['patch'], url_path='accept', detail=True)
    def accept_verification(self, request, pk):
        obj = self.get_object()
        obj.status = VerificationSeller.RequestStatus.ACCEPT
        obj.reason = request.data.get('reason', None)
        obj.employee = request.user
        obj.save()
        # Create new store if accept request
        Store.objects.create(
            name=obj.temp_store_name,
            description=obj.temp_store_description,
            logo=obj.temp_store_logo,
            owner=obj.user
        )
        # Change user_role to SELLER
        obj.user.user_role = User.UserRole.SELLER
        obj.user.save()
        return Response(serializers.VerificationSellerSerializer(obj).data, status=status.HTTP_200_OK)

    @action(methods=['patch'], url_path='reject', detail=True)
    def reject_verification(self, request, pk):
        obj = self.get_object()
        obj.status = VerificationSeller.RequestStatus.REJECTED
        obj.reason = request.data.get('reason', None)
        obj.employee = request.user
        obj.save()
        return Response(serializers.VerificationSellerSerializer(obj).data, status=status.HTTP_200_OK)
