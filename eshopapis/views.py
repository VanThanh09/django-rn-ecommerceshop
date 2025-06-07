import base64
import json
from collections import defaultdict
from datetime import timedelta

from django.db.models.functions import TruncDay, TruncMonth
from django.http import JsonResponse
from django.utils.timezone import now
from rest_framework.pagination import PageNumberPagination
from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
import cloudinary.api
from django.db.models import Min, Avg, Sum, F
from eshopapis.models import Product, Store, User, VerificationSeller, ProductVariant, Attribute, AttributeValue, Order, \
    OrderDetail, CartDetail, Cart, Category, CommentUser, StoreRating, CommentImage, CommentSeller, Payment
from eshopapis import serializers, perms, paginators
from eshopapis.utils import callApiMoMo


# Hàm để xóa ảnh từ Cloudinary
def delete_image_from_cloudinary(image_url):
    # Trích xuất public ID từ URL của Cloudinary
    public_id = image_url.split('/')[-1].split('.')[0]  # Tách public ID từ URL

    try:
        image_delete_result = cloudinary.api.delete_resources(public_id, resource_type="image", type="upload")
        print(image_delete_result)
    except Exception as e:
        print(f"Không thể xóa ảnh: {e}")


@api_view(['GET'])
def revenue_chart_data(request):
    """API trả về dữ liệu doanh thu theo ngày"""

    days = int(request.GET.get('days', 7))

    start_date = now().date() - timedelta(days=days)

    if days<151:
        orders = (
            OrderDetail.objects
            .filter(order__created_date__gte = start_date, order_status = OrderDetail.OrderStatus.SUCCESS)
            .annotate(day=TruncDay('order__created_date'))
            .values('day')
            .annotate(total=Sum('product_variant__price'))
            .order_by('day')
        )
        chart_data = [
            {
                "date": item["day"].strftime('%d/%m'),
                "revenue": item["total"]
            }
            for item in orders
        ]
    else:
        orders = (
            OrderDetail.objects
            .filter(order__created_date__gte=start_date, order_status=OrderDetail.OrderStatus.SUCCESS)
            .annotate(month=TruncMonth('order__created_date'))
            .values('month')
            .annotate(total=Sum('product_variant__price'))
            .order_by('month')
        )
        chart_data = [
            {
                "date": item["month"].strftime('%Y-%m'),
                "revenue": item["total"]
            }
            for item in orders
        ]

    return JsonResponse(chart_data, safe=False)


@api_view(['GET'])
@permission_classes([perms.IsSeller])
def revenue_of_store(request):

    start_date = now().date() - timedelta(days=365)

    store = Store.objects.filter(owner=request.user).first()
    orders_success = OrderDetail.objects.filter(store=store, order_status=OrderDetail.OrderStatus.SUCCESS)
    orders_count = orders_success.count()

    total_revenue = orders_success.filter(order_status="SU").aggregate(
        total=Sum(F('quantity') * F('product_variant__price'))
    )['total'] or 0

    store_rating = StoreRating.objects.filter(store__owner_id=request.user).aggregate(avg=Avg('rating'))['avg'] or 0

    orders_1_year = (
        orders_success.filter(order__created_date__gte=start_date)
        .annotate(month=TruncMonth('order__created_date'))
        .values('month')
        .annotate(total=Sum('product_variant__price'))
        .order_by('month')
    )

    chart_data = [
        {
            "date": item["month"].strftime('%m-%Y'),
            "revenue": item["total"]
        }
        for item in orders_1_year
    ]

    top_product = (orders_success
                   .values('product_variant__product__id', 'product_variant__product__name')
                   .annotate(total_sold = Sum('quantity'))
                   .order_by('-total_sold')[:10]
                   )

    result = {
        "orders_count": orders_count,
        "total_revenue": "{:,.0f}".format(total_revenue),
        "chart_data": chart_data,
        "top_product": top_product,
        "store_rating": store_rating,
    }

    return Response(result, status=status.HTTP_200_OK)


# Create new user
class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True).all()
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['get'], url_path='current_user', detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        return Response(serializers.UserSerializer(request.user).data)

    # create cart with user
    def perform_create(self, serializer):
        user = serializer.save()
        Cart.objects.create(user=user, total_quantity=0)

    @action(methods=['get'], url_path='info_user', detail=True)
    def get_info_user(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            return Response(serializers.InfoUserSerializer(user).data)
        except Exception as e:
            print(e)
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)



class UserUpdateGenericsView(generics.UpdateAPIView):
    serializer_class = serializers.UserSerializer
    permission_classes = [perms.IsCustomerOrSeller]

    def get_object(self):
        # Get user from request (example using request.user)
        return self.request.user


class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = serializers.CategorySerializer


# Return list of all product
class ProductViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True).order_by('id')
    serializer_class = serializers.ProductSerializer
    pagination_class = paginators.ProductPage

    # ?category_id = 1 & category_id = 2 & category_id = 3
    def get_queryset(self):
        queryset = self.queryset

        # Tìm kiếm search bar
        q = self.request.query_params.get('q')
        if q:
            queryset = queryset.filter(name__icontains=q)

        # Tìm kiếm theo category
        cate_id = self.request.query_params.getlist('category_id')
        if cate_id:
            queryset = queryset.filter(category__id__in=cate_id).distinct()

        queryset = queryset.annotate(price=Min('productvariant__price')) # Tạo cột ảo (min_price) để sắp xếp ảo

        # Tìm giá thấp nhấp, giá cao nhất
        price_min = self.request.query_params.get('price_min')
        price_max = self.request.query_params.get('price_max')
        if price_min:
            queryset = queryset.filter(price__gte=price_min)
        if price_max:
            queryset = queryset.filter(price__lte=price_max)

        # Sắp xếp theo giá
        order_price = self.request.query_params.get('order_price')
        if order_price:
            if order_price == '1':
                queryset=queryset.order_by('price')
            elif order_price == '-1':
                queryset=queryset.order_by('-price')

        return queryset


# Return detail of product ( all variant of product)
class ProductDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True)
    serializer_class = serializers.ProductDetailSerializer

    """
        Lấy các 5 comment moi nhat trong 1 sản phẩm, trung binh so sao
    """

    @action(methods=['GET'], detail=True, url_path='top5comments')
    def getTop5CommentRecent(self, request, pk):
        list_product_variant = self.get_object().productvariant_set.all()
        list_comment = CommentUser.objects.none()

        for p in list_product_variant:
            list_comment = list_comment.union(p.comments.all())

        # Trung binh so sao
        average_rating = 0
        hasRating = False
        total_rating = len(list(list_comment))
        productHasRating = CommentUser.objects.filter(product_variant__product__id=self.get_object().id)
        if productHasRating.exists():
            average_rating = productHasRating.aggregate(Avg('rating'))['rating__avg']
            hasRating = True
            list_comment = list_comment.order_by('-created_date')[:5]

        data = {'total_rating': total_rating, 'average_rating': round(average_rating, 1), 'hasRating': hasRating,
                'comments': serializers.CommentUserViewSerializer(list_comment, many=True).data}
        return Response(data=data, status=status.HTTP_200_OK)

    @action(methods=['GET'], detail=True, url_path='comments')
    def getAllComment(self, request, pk):
        list_product_variant = self.get_object().productvariant_set.all()
        list_comment = CommentUser.objects.none()

        for p in list_product_variant:
            list_comment = list_comment.union(p.comments.order_by('-created_date'))

        list_comment = list_comment.order_by('-created_date')

        return Response(data=serializers.CommentUserViewSerializer(list_comment, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['GET'], detail=True, url_path='sold')
    def getCountProductSold(self, request, pk):
        list_product_variant = self.get_object().productvariant_set.all()

        sold_items = 0
        for p in list_product_variant:
            count = OrderDetail.objects.filter(order_status='SU', product_variant=p).aggregate(count=Sum('quantity'))[
                'count']
            if count:
                sold_items += count

        return Response({'sold_items': sold_items}, status=status.HTTP_200_OK)


# Add new product and variants of this
class ProductCreateViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = Product.objects.filter(active=True).all()
    serializer_class = serializers.ProductCreateSerializer
    permission_classes = [perms.IsSeller]  # Just for seller
    parser_classes = [parsers.MultiPartParser]

    def create(self, request, *args, **kwargs):
        """
        Lấy dữ liệu từ request
        Gắn store tương ứng với người dùng hiện tại
        Tạo sản phẩm
        Xử lý danh sách biến thể (variants) của sản phẩm
        Tạo và gắn các thuộc tính cho từng biến thể
        """
        store = Store.objects.filter(owner=self.request.user).first()

        # Dữ liệu mặc định hợp lệ
        default_data = {
            "store": store.id,
            "logo": 'not_found',
            "productvariant_set": [],  # Để trống để lưu product trước làm khóa ngoại cho product_variant
        }

        # Chuyển category_set từ chuỗi '2,3,4' => [2, 3, 4]
        category_raw = request.data.get("category_set")
        if category_raw:
            if isinstance(category_raw, str):
                try:
                    request.data.setlist("category_set", [int(i) for i in category_raw.split(",")])
                except ValueError:
                    return Response({"detail": "category_set phải là danh sách số nguyên."}, status=400)

        # Thêm default data và data để lưu trước
        for field, default_value in default_data.items():
            if field not in request.data:
                if field == "productvariant_set":
                    request.data.setlist("productvariant_set", [])
                else:
                    request.data[field] = default_value

        serializer = self.get_serializer(data=request.data)  # bọc dữ liệu vào serializer để kiểm tra
        serializer.is_valid(raise_exception=True)
        product = serializer.save()  # Hợp lệ rồi thì lưu dữ liệu (create product)

        index = 0
        while True:
            prefix = f"variants[{index}]"
            price = request.data.get(f"{prefix}[price]")
            quantity = request.data.get(f"{prefix}[quantity]")
            attributes_json = request.data.get(f"{prefix}[attributes]")
            logo_file = request.FILES.get(f"{prefix}[logo]")

            if not price and not quantity:
                break  # Không còn variant nào nữa

            attributes = []
            attrs = json.loads(attributes_json) # lấy từng attribute value ra để lưu
            for attr in attrs:
                attr_obj, _ = Attribute.objects.get_or_create(
                    name=attr["name"])
                attr_value, _ = AttributeValue.objects.get_or_create(
                    value=attr["value"],
                    attribute=attr_obj,
                )
                attributes.append(attr_value.id)

            product_variant = ProductVariant.objects.create(
                quantity=quantity,
                price=price,
                logo = logo_file,
                product=product
            )
            product_variant.attributes.set(attributes)
            index += 1

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductUpdateViewSet(viewsets.ViewSet, generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = serializers.ProductCreateSerializer
    permission_classes = [perms.UpdateProductPermission]
    parser_classes = [parsers.MultiPartParser]

    def update(self, request, *args, **kwargs):
        product = self.get_object()

        data = request.data.copy()

        # Chuyển category_set từ chuỗi '2,3,4' => [2, 3, 4]
        category_raw = data.get("category_set")
        if category_raw:
            if isinstance(category_raw, str):
                try:
                    data.setlist("category_set", [int(i) for i in category_raw.split(",")])
                except ValueError:
                    return Response({"detail": "category_set should be list of integer."}, status=400)

        # Giữ các logo còn sử dụng
        keep_logo_urls = []
        index = 0
        while True:
            prefix = f"variants[{index}]"
            price = request.data.get(f"{prefix}[price]")
            quantity = request.data.get(f"{prefix}[quantity]")
            logo_url = request.data.get(f"{prefix}[logo_url]")

            if not price and not quantity:
                break
            if logo_url:
                keep_logo_urls.append(logo_url)
            index += 1

        # Xóa các logo không cần
        for v in product.productvariant_set.all():
            if v.logo and v.logo.url not in keep_logo_urls:
                delete_image_from_cloudinary(v.logo.url)

        # Lưu thông tin cơ bản
        serializer = self.get_serializer(product, data=data, partial=True)  # bọc dữ liệu vào serializer để kiểm tra
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Thêm biến thể mới lại
        index = 0
        while True:
            prefix = f"variants[{index}]"
            variant_id = request.data.get(f"{prefix}[id]")

            price = request.data.get(f"{prefix}[price]")
            quantity = request.data.get(f"{prefix}[quantity]")
            attributes_json = request.data.get(f"{prefix}[attributes]")
            logo_file = request.FILES.get(f"{prefix}[logo]")
            logo_url = request.data.get(f"{prefix}[logo_url]")

            if not logo_file and logo_url:
                logo_file = f"image/upload/{logo_url.split('image/upload/')[1].strip()}"

            if not price and not quantity:
                break  # Không còn variant nào nữa

            if variant_id:
                variant = ProductVariant.objects.get(pk=variant_id)
                variant.price = price
                variant.quantity = quantity
                variant.logo = logo_file
                variant.save()

                index += 1

                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                attributes = []

                attrs = json.loads(attributes_json)  # lấy từng attribute value ra để lưu
                for attr in attrs:
                    attr_obj, _ = Attribute.objects.get_or_create(
                        name=attr["attribute_name"])
                    attr_value, _ = AttributeValue.objects.get_or_create(
                        value=attr["value"],
                        attribute=attr_obj,
                    )
                    attributes.append(attr_value.id)

                product_variant = ProductVariant.objects.create(
                    quantity=quantity,
                    price=price,
                    logo=logo_file,
                    product=product
                )
                product_variant.attributes.set(attributes)
                index += 1

            return Response(serializer.data, status=status.HTTP_200_OK)


# Return a store detail
class StoreDetailViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Store.objects.filter(active=True)
    serializer_class = serializers.StoreSerializer
    pagination_class = paginators.ProductPage

    # Return all product of a store
    @action(methods=['get'], detail=False, url_path='products')
    def get_products(self, request, pk=None):
        store = self.request.user.store_set.first()
        if not store:
            return Response({"detail": "Store not found."}, status=status.HTTP_404_NOT_FOUND)

        products = Product.objects.filter(store__id=store.id).order_by('created_date')

        page = self.paginate_queryset(products)
        # Nếu có phân trang
        if page:
            serializer = serializers.ProductSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        else:
            return Response(serializers.ProductSerializer(products, many=True).data, status=status.HTTP_200_OK)

    @action(methods=['get'], detail=True, url_path='rating')
    def get_avg_store_rating(self, request, pk):
        store = self.get_object()
        average_rating = 0
        storeHasRating = StoreRating.objects.filter(store=store)
        hasRating = False
        if storeHasRating.exists():
            hasRating = True
            average_rating = storeHasRating.aggregate(Avg('rating'))['rating__avg']

        return Response({'average_rating_store': round(average_rating, 1), 'hasRating': hasRating},
                        status=status.HTTP_200_OK)

    def get_total_product(self, pk):
        store = Store.objects.get(pk=pk)
        products = store.product_set.filter(active=True)

        return products.count()

    @action(methods=['GET'], detail=True, url_path='store_info')
    def get_store_info(self, request, pk):
        data = {}
        data['store_info'] = serializers.StoreProductSerializer(self.get_object()).data
        data['rating'] = self.get_avg_store_rating(request, pk).data
        data['total_product'] = self.get_total_product(pk)

        return Response(data=data, status=status.HTTP_200_OK)

    @action(methods=['GET'], detail=False, url_path='my_store', permission_classes=[perms.IsSeller])
    def get_my_store(self, request):
        store = Store.objects.filter(active=True, owner=request.user).first()
        if not store:
            return Response({"detail": "Store not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response(serializers.StoreSerializer(store).data, status=status.HTTP_200_OK)


# POST api for customer want to become seller
class VerificationSellerViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = VerificationSeller.objects.filter(status='PE').order_by('created_date')
    serializer_class = serializers.VerificationSellerSerializer
    parser_classes = [parsers.MultiPartParser]

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
        if VerificationSeller.objects.filter(user=user, status='PE').exists():
            return Response({"detail": "The request already exists."}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    # save the request with user send request
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# PATCH API for employee accept or reject the request become seller
class ActionVerificationViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = VerificationSeller.objects.filter(status='PE')
    serializer_class = serializers.VerificationSellerSerializer
    permission_classes = [perms.IsEmployee]

    @action(methods=['patch'], url_path='accept', detail=True)
    def accept_verification(self, request, pk=None):
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
            owner=obj.user,
            store_address=obj.temp_store_address,
            owner_name=obj.temp_owner_name,
            owner_ident=obj.temp_owner_ident
        )

        # Change user_role to SELLER
        obj.user.user_role = User.UserRole.SELLER
        obj.user.save()
        return Response(serializers.VerificationSellerSerializer(obj).data, status=status.HTTP_200_OK)

    @action(methods=['patch'], url_path='reject', detail=True)
    def reject_verification(self, request, pk=None):
        obj = self.get_object()
        reason = request.data.get('reason')
        if reason:
            obj.status = VerificationSeller.RequestStatus.REJECTED
            obj.reason = request.data.get('reason', None)
            obj.employee = request.user
            obj.save()
            return Response(serializers.VerificationSellerSerializer(obj).data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Please give the reason for rejection"}, status=status.HTTP_400_BAD_REQUEST)


"""
    Get all product in the cart in format of basic information
"""
def change_cart_detail_active(cart):
    list_cart_detail = CartDetail.objects.filter(cart=cart)
    for c in list_cart_detail:
        c.active = c.product_variant.active
        c.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_products_in_cart(request):
    cart = Cart.objects.get(user=request.user)

    # if cart.total_quantity == 0:
    #     return Response(data={'msg': 'No product in cart'}, status=status.HTTP_200_OK)
    # Update if product_variant still active or not

    serializer = serializers.CartSerializer(cart)
    return Response(data=serializer.data, status=status.HTTP_200_OK)
    #return Response(data={'total_quantity': cart.total_quantity}, status=status.HTTP_200_OK)


"""
    /cart
    Get list product detail in cart
    Use case: When user want to see what they have in cart
"""

@api_view(['GET'])
@permission_classes([perms.IsCustomerOrSeller])
def get_products_detail_in_cart(request):
    stores = set()
    cart = request.user.cart
    # Check exist deactive product
    change_cart_detail_active(cart=cart)
    # Add distinct store in set
    for pvar in cart.products.all():
        stores.add(pvar.product.store)
    if not stores:
        return Response(data=[], status=status.HTTP_200_OK)
    # Response data to client
    data = []
    for store in stores:
        products_same_store = {}
        store_serializer = serializers.CartStoreSerializer(store)
        products_same_store['store'] = store_serializer.data
        # Getting list of product from a store
        # Indeed the product_variant variable just a cart detail with filter condition
        product_variants = cart.cartdetail_set.filter(product_variant__product__store=store)
        pv_serializer = serializers.CartProductVariantSerializer(product_variants, many=True)
        products_same_store['product_variants'] = pv_serializer.data
        data.append(products_same_store)

    return Response(data=data, status=status.HTTP_200_OK)


# Need to do get all cart detail in a cart group by shop
# Chon san pham -> Bam nut mua hang --> Trang thanh toan -> Bam nut dat hang -> Tao order

"""
    API handling process when user tick products to checkout
    Xử lý những cart detail mà người  dùng tick 
    Request body 
    {
        "selected_products": [
        {
            quantity: int,
            price: int
        },
         {
            quantity: int,
            price: int
        }

        ]
    }
"""


# URL cart/tick-products/ chua biet co dung hay khong vi tren front end co the xu ly tong tien va tong san pham
@api_view(['POST'])
@permission_classes([perms.IsCustomerOrSeller])
def handle_tick_products(request):
    list_selected_product = request.data.get('selected_products')
    total_products = len(list_selected_product)
    total_price = 0
    for p in list_selected_product:
        total_price += (p.get('price') * p.get('quantity'))

    return Response(data={'total_price': total_price,
                          'total_products': total_products
                          }, status=status.HTTP_200_OK)


def store_distinct(data):
    stores = set()
    for pk in data:
        stores.add(ProductVariant.objects.get(pk=pk).product.store)
    return stores


@api_view(['POST'])
@permission_classes([perms.IsCustomerOrSeller])
def checkout(request):
    stores = store_distinct(request.data.get('list_product_variant'))
    if not stores:
        return Response(data={"msg": "Empty"}, status=status.HTTP_200_OK)
    # Response data to client
    data = {}
    user = serializers.UserSerializer(request.user).data
    data['user'] = user
    data['cart_items'] = []
    cart_detail_set = request.data.get('list_cart_detail')
    for store in stores:
        products_same_store = {}
        store_serializer = serializers.CartStoreSerializer(store)
        products_same_store['store'] = store_serializer.data
        # Getting list of product from a store
        # Indeed the product_variant variable just a cart detail with filter condition
        product_variants = list(
            CartDetail.objects.filter(pk__in=cart_detail_set, product_variant__product__store=store))
        pv_serializer = serializers.CartProductVariantSerializer(product_variants, many=True)
        products_same_store['product_variants'] = pv_serializer.data
        total_price = 0
        total_quantity = 0
        for p in products_same_store['product_variants']:
            total_price += p.get('total_price')
            total_quantity += p.get('quantity')
        products_same_store['total_price'] = total_price
        products_same_store['total_quantity'] = total_quantity
        data['cart_items'].append(products_same_store)

        total_final_price = 0
        total_final_quantity = 0
        for item in data['cart_items']:
            total_final_price += item.get('total_price')
            total_final_quantity += item.get('total_quantity')
        data['total_final_price'] = total_final_price
        data['total_final_quantity'] = total_final_quantity

    return Response(data=data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([perms.IsCustomerOrSeller])
def checkout_for_buynow(request):
    # Response data to client
    data = {}
    user = serializers.UserSerializer(request.user).data
    data['user'] = user
    data['cart_items'] = []
    products_same_store = {}
    store_serializer = serializers.CartStoreSerializer(Store.objects.get(pk=request.data.get('store')))
    products_same_store['store'] = store_serializer.data
    product_variant = ProductVariant.objects.get(pk=request.data.get('product_variant'))
    pv_serializer = serializers.ProductVariantWithProductNameSerializer(product_variant)
    products_same_store['product_variants'] = [{
        'product_variant': pv_serializer.data,
        'quantity': request.data.get('quantity')
    }]
    total_price = 0
    for p in products_same_store['product_variants']:
        total_price += request.data.get('quantity') * p.get('product_variant').get('price')
    total_quantity = request.data.get('quantity')
    products_same_store['total_price'] = total_price
    products_same_store['total_quantity'] = total_quantity
    data['cart_items'].append(products_same_store)

    total_final_price = 0
    total_final_quantity = 0
    for item in data['cart_items']:
        total_final_price += item.get('total_price')
        total_final_quantity += item.get('total_quantity')
    data['total_final_price'] = total_final_price
    data['total_final_quantity'] = total_final_quantity

    return Response(data=data, status=status.HTTP_200_OK)


def get_cart_products_data(user):
    stores = set()
    cart = user.cart
    change_cart_detail_active(cart=cart)

    for pvar in cart.products.all():
        stores.add(pvar.product.store)

    if not stores:
        return []

    data = []
    for store in stores:
        products_same_store = {}
        store_serializer = serializers.CartStoreSerializer(store)
        products_same_store['store'] = store_serializer.data

        product_variants = cart.cartdetail_set.filter(product_variant__product__store=store)
        pv_serializer = serializers.CartProductVariantSerializer(product_variants, many=True)
        products_same_store['product_variants'] = pv_serializer.data

        data.append(products_same_store)

    return data


# CartDetail Create Partial-Update Delete
class CartDetailViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.UpdateAPIView, generics.DestroyAPIView):
    queryset = CartDetail.objects.all()
    serializer_class = serializers.CartDetailSerializer
    permission_classes = [perms.IsCustomerOrSeller, perms.OwnerCartDetailPermission]

    def perform_create(self, serializer):
        serializer.save(cart=self.request.user.cart)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)

        return Response(get_cart_products_data(request.user), status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        # Before delete a cart detail cart.total_quantity --
        instance.cart.total_quantity -= 1
        instance.cart.save()
        instance.delete()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(get_cart_products_data(request.user), status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        cart_detail_ids = request.data
        cart_details = CartDetail.objects.filter(id__in=cart_detail_ids)

        for cart_detail in cart_details:
            self.check_object_permissions(request, cart_detail)

        if cart_details:
            cart = cart_details[0].cart  # assume all items are in same cart
            cart.total_quantity -= len(cart_details)
            cart.save()

        for cart_detail in cart_details:
            cart_detail.delete()

        return Response(get_cart_products_data(request.user), status=status.HTTP_200_OK)


# Create multiple cart detailAdd commentMore actions

@api_view(['POST'])
@permission_classes([perms.OwnerCartDetailPermission])
def create_mul_cartdetail(request):
    product_variants = request.data.pop('product_variants')
    cart = request.user.cart
    if cart.id != request.data.get('cart_id'):
        return Response(data={"msg": "This is not your cart!!!"}, status=status.HTTP_403_FORBIDDEN)

    if product_variants:
        for variant in product_variants:
            cartDetail, created = CartDetail.objects.get_or_create(cart=cart,product_variant_id=variant.get('id'))
            cartDetail.quantity += variant.get('quantity')
            if created:
                cart.total_quantity += 1
            cartDetail.save()
            cart.save()

    serializer = serializers.CartSerializer(cart)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# Done cart/ , cart-basic-info, checkout
# Create order, orderDetail for each shop, after that remove all the from cart

#################################### Product comment API ###############################################

class CommentUserViewSet(viewsets.ViewSet, generics.CreateAPIView,generics.UpdateAPIView,generics.DestroyAPIView):
    queryset = CommentUser.objects.all()
    serializer_class = serializers.CommentUserViewSerializer
    permission_classes = [perms.IsCustomerOrSeller]

    # def get_serializer_class(self):
    #     if action == 'create':
    #         return serializers.CommentUserCreateSerializer

    def get_parser_classes(self):
        if self.action in ['create', 'partial_update']:
            return [MultiPartParser, FormParser]
        return super().get_parser_classes()

    def get_permissions(self):
        if self.action == 'list':
            return []
        if self.action in ['partial_update','destroy']:
            return [perms.OwnerPermission()]
        if self.action == 'create_rep_cmt':
            return [perms.CommentSellerCreatePermission()]
        return super().get_permissions()

    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)

    """
    Create comment res: {
        content, rating, product_variant, image_list:[]
    }
    form data
    """
    def create(self, request, *args, **kwargs):
        # A user can comment about the product of it's store
        product_variant = ProductVariant.objects.get(pk=request.data.get('product_variant'))
        order_detail = OrderDetail.objects.get(pk=request.data.get('order_detail'))
        content = request.data.get('content')
        rating = request.data.get('rating')

        if (request.user == product_variant.product.store.owner):
            return Response(data={"msg": "Can not comment on your own product"}, status=status.HTTP_403_FORBIDDEN)

        image_list = request.FILES.getlist('image_list')

        # Luu comment
        newComment = CommentUser.objects.create(product_variant=product_variant, content=content, rating=rating, user=request.user)

        # Luu file hinh anh cho comment
        for image in image_list:
            CommentImage.objects.create(image=image, comment=newComment)

        serializer = serializers.CommentUserViewSerializer(newComment)

        order_detail.is_commented = True
        order_detail.save()

        return Response(data=serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = serializers.CommentUserSerializer(instance=instance,data=request.data,partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save() #Choose whether update or create comment
        serializerResponse = serializers.CommentUserViewSerializer(instance)
        return Response(serializerResponse.data, status=status.HTTP_202_ACCEPTED)

    @action(methods=['POST'],detail=True,url_path='create_rep_cmt')
    def create_rep_cmt(self,request,pk=None):
        cmt = self.get_object()
        rep_cmt = CommentSeller.objects.create(rep_cmt=cmt, content=request.data.get('content'),seller=request.user)
        return Response(serializers.CommentSellerSerializer(rep_cmt).data, status=status.HTTP_201_CREATED)


class CommentSellerViewSet(viewsets.ViewSet, generics.UpdateAPIView,generics.DestroyAPIView):
    queryset = CommentSeller.objects.all()
    serializer_class = serializers.CommentSellerSerializer
    permission_classes = [perms.CommentSellerOwnerPermission]


"""
    update like của những comment khi nguwoif dùng click vào nút like comment
    request : []
"""
@api_view(['POST'])
@permission_classes([perms.IsCustomerOrSeller])
def updateLikeComments(request):
    comments = request.data.get('comments')
    for id in comments:
        c = CommentUser.objects.get(pk=id)
        c.like += 1
        c.save()

    return Response(status=status.HTTP_200_OK)


######################################################## ORDER #####################################################

def createOrder(customer,total_price,payment_method,paid, shipping_address):
    return Order.objects.create(customer=customer,payment_method=payment_method
                                       ,total_price=total_price,paid=paid,shipping_address=shipping_address)
def createOrderDetail(order, products):
    for p in products:
        variant = ProductVariant.objects.get(pk=p.get('product_variant_id'))
        store = variant.product.store
        variant.quantity = variant.quantity - p.get('quantity')
        variant.save()
        OrderDetail.objects.create(order=order,product_variant_id=p.get('product_variant_id'),quantity=p.get('quantity'),store=store)

def removeCartDetail(cart_detail_list):
    for id in cart_detail_list:
        c = CartDetail.objects.get(pk=id)
        c.cart.total_quantity -= 1
        c.cart.save()
        c.delete()

class OrderDetailUpdateViewSet(viewsets.ViewSet,generics.UpdateAPIView):
    queryset = OrderDetail.objects.all()
    serializer_class = serializers.OrderDetailUpdateSerializer
    permission_classes = [perms.OrderDetailUpdatePermission]

    @action(methods=['patch'], url_path='cancel_order', detail=True, permission_classes=[perms.CancelOrderDetailPermission])
    def cancel_order(self, request, pk=None):
        order_detail = self.get_object()

        if order_detail.order_status != OrderDetail.OrderStatus.PENDING:
            return Response({'detail': 'Only cancel order pending'}, status=status.HTTP_400_BAD_REQUEST)

        # Update order status
        order_detail.order_status = OrderDetail.OrderStatus.CANCEL
        order_detail.save()

        # Update product variant quantity
        product_variant = order_detail.product_variant
        product_variant.quantity += order_detail.quantity
        product_variant.save()

        return Response(serializers.OrderDetailUpdateSerializer(order_detail).data, status=status.HTTP_200_OK)


class OrderViewSet(viewsets.ViewSet,generics.CreateAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = serializers.OrderSerializer

    # def get_serializer_class(self):
    #     if self.action == 'retrieve':
    #         return serializers.OrderSerializer
    #     return serializers.OrderSerializer

    def get_permissions(self): # Initilize instance of permission class
        if self.action == 'create':
            self.permission_classes = [perms.IsCustomerOrSeller]
        elif self.action in ['update', 'partial_update','retrieve']:
            self.permission_classes = [perms.IsCustomerOrSeller, perms.OrderUpdatePermission]
        elif self.action == 'destroy':
            self.permission_classes = [perms.IsCustomerOrSeller,perms.OwnerOrderPermission]
        return super().get_permissions()

    """
    Save Order to the database
    Create new Order Detail and associate it with Order
    """
    def create(self, request, *args, **kwargs):
       # A customer can not buy a product from its store
       print(request.data)

       stores = request.data.get('stores')
       for id in stores:
           store = Store.objects.get(pk=id)
           if store.owner == request.user:
               return Response(data={"result" : False, "msg": "Không thể mua hàng từ của hàng của mình"},status=status.HTTP_400_BAD_REQUEST)

       payment_method = request.data.get('payment_method')
       if (payment_method.get('method') == 'OF'):
           products = request.data.pop('products')
           order_total_price = request.data.get('total_price')
           paid = request.data.get('paid')
           cart_detail_list = request.data.get('cart_detail_list')
           shipping_address = request.data.get('shipping_address')

           newOrder = createOrder(customer=request.user,total_price=order_total_price,payment_method=payment_method.get('method'),paid=paid,shipping_address=shipping_address)
           createOrderDetail(products=products,order=newOrder)
           removeCartDetail(cart_detail_list)

           return Response({'result':True, 'msg': 'Tạo đơn haàng thành công'}, status=status.HTTP_201_CREATED)

       if (payment_method.get('method') == 'ON'):
           if(payment_method.get('portal') == 'MOMO'):
               # Call api momo
               data = request.data.copy()
               data['user_id'] = request.user.id
               # Momo response kết quả xác nhận xử lý yeeu cầu tạo thanh toán
               MomoResponse = callApiMoMo(data)

               if MomoResponse.get('resultCode') == 0:
                   return Response(
                       data={
                           'result_code': 0,
                           'deeplink': MomoResponse.get('deeplink'),
                           'msg':"Gửi yêu cầu thanh toán thành công"
                       },
                       status=status.HTTP_200_OK
                   )

               return Response(data={'result_code': MomoResponse.get('resultCode'), 'msg': "Có lỗi xảy ra"}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = serializers.OrderUpdateSerializer(instance=instance,data=request.data,partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save() #Choose whether update or create order

        return Response({"result":True, "msg":"Đã update kết quả thanh toán"}, status=status.HTTP_202_ACCEPTED)



# API handle momo request

@api_view(['POST'])
def callbackMoMo(request):
    print('==> Momo request')
    print(request.data)

    print('Extra data expected same the with order')
    print(request.data.get('extraData'))

    # Dữ liệu lấy từ momo
    resultCode = request.data.get('resultCode')
    orderId = request.data.get('orderId')
    requestId = request.data.get('requestId')
    amount = request.data.get('amount')
    data = request.data.get('extraData','')
    try:
        data = json.loads(base64.b64decode(data).decode())
    except Exception:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    products = data.pop('products')
    payment_method = data.get('payment_method')
    order_total_price = data.get('total_price')
    cart_detail_list = data.get('cart_detail_list')
    user_id = data.get('user_id')
    shipping_address = data.get('shipping_address')

    # Khach hang thanh toan thanh cong
    if (resultCode == 0):
        paid = True
        # Tạo order detail, rm cart detail ...
        newOrder = Order.objects.create(customer_id=user_id, total_price=order_total_price,
                                        payment_method=payment_method.get('method'), paid=paid, shipping_address=shipping_address)
        createOrderDetail(products=products, order=newOrder)
        removeCartDetail(cart_detail_list)
        # Tao payment
        Payment.objects.create(order=newOrder, order_payment_id=orderId, request_id=requestId,
                               portal_payment=payment_method.get('portal'), amount=float(amount),payment_status=True)
    # Thanh toán không thành công
    else:
        Payment.objects.create(order_payment_id=orderId,request_id=requestId,portal_payment=payment_method.get('portal'),
                               amount=amount, payment_status=False)

    return Response(status=status.HTTP_200_OK)


# UserOrder Function based view
"""
    Get list of order that user has ordered with the status as query param
    Ex: user/orders/
        user/orders/?status=PE
"""

@api_view(['GET'])
@permission_classes([perms.IsCustomerOrSeller])
def user_purchase_list(request):
    if request.query_params.get('status') == None:
        orders = OrderDetail.objects.filter(order__customer=request.user).order_by('-id')
    else:
        orders = OrderDetail.objects.filter(order__customer=request.user,
                                      order_status=request.query_params.get('status')).order_by('-id')

    if not orders:
        return Response([])

    print(orders)
    paginator = PageNumberPagination()
    paginator.page_size = 8
    paginated_orders = paginator.paginate_queryset(orders, request)

    serializer = serializers.OrderDetailSerializer(paginated_orders, many=True)

    return paginator.get_paginated_response(serializer.data)


# StoreOrder Function based view
"""
    Get list of order that a store have with the status as query param
    Ex: store/order/
        store/order/?status=PE
"""

@api_view(['GET'])
@permission_classes([perms.IsSeller])
def storeorder_list(request):
    status_filter = request.query_params.get('status')

    if status_filter == "PE":
        store_id = request.user.store_set.values_list('id', flat=True).first()

        order_detail_qs = OrderDetail.objects.filter(store=store_id)

        order_detail_qs = order_detail_qs.filter(order_status=status_filter)

        grouped = defaultdict(list)
        # grouped[1].append('new') auto create {1: ['new']} if not exist

        for order_detail in order_detail_qs:
            customer = order_detail.order.customer
            customer_id = order_detail.order.customer.id

            order = serializers.OrderStoreSerializer(order_detail).data

            grouped[customer_id ].append((customer,order))

        result = []
        for customer_id, items in grouped.items():
            customer_info, _ = items[0]
            result.append({
                "customer": {
                    "id": customer_info.id,
                    "firstname": customer_info.first_name,
                    "lastname": customer_info.last_name,
                },
                "data": [data for _, data in items]
            })

        return Response(result, status=status.HTTP_200_OK)
    else:
        if status_filter is None:
            orders = OrderDetail.objects.filter(
                store=request.user.store_set.values_list('id', flat=True)[0])  # Getting id of request.user's store
        else:
            orders = OrderDetail.objects.filter(store=request.user.store_set.values_list('id', flat=True)[0],
                                                order_status=status_filter)
        serializer = serializers.OrderStoreSerializer(orders, many=True)

        if not orders:
            return Response([])

        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([perms.IsSeller])
def count_order_pending(request):
    store_id = request.user.store_set.values_list('id', flat=True).first()
    result = OrderDetail.objects.filter(store=store_id, order_status=OrderDetail.OrderStatus.PENDING).count()

    return Response({'count' :result}, status=status.HTTP_200_OK)


 ############################### Store rating ##################################
@api_view(['POST'])
@permission_classes([perms.IsCustomerOrSeller])
def create_store_rating(request):
    store_rating_serializer = serializers.StoreRatingSerializer(data=request.data)
    store_rating_serializer.is_valid(raise_exception=True)
    new_store_rating = store_rating_serializer.save(user=request.user)
    return Response(serializers.StoreRatingSerializer(new_store_rating).data , status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([perms.IsCustomerOrSeller])
def verify_isPaid_orderId(request):
    order_id = request.data.get('order_id')
    payment = Payment.objects.filter(order_payment_id=order_id).first()
    if (payment):
        return Response({'paid': payment.payment_status}, status=status.HTTP_200_OK)
    else:
        return Response({'paid': False}, status=status.HTTP_200_OK)