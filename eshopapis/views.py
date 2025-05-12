import json
from rest_framework import viewsets, generics, status, parsers, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
import cloudinary.api

from eshopapis.models import Product, Store, User, VerificationSeller, ProductVariant, Attribute, AttributeValue, Order, \
    OrderDetail, CartDetail, Cart, Category
from eshopapis import serializers, perms, paginators


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
    parser_classes = [parsers.MultiPartParser]

    @action(methods=['get'], url_path='current_user', detail=False, permission_classes=[permissions.IsAuthenticated])
    def get_current_user(self, request):
        return Response(serializers.UserSerializer(request.user).data)


class CategoryViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = serializers.CategorySerializer


# Return list of all product
class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Product.objects.filter(active=True)
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

        return queryset


# Return detail of product ( all variant of product)
class ProductDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True)
    serializer_class = serializers.ProductDetailSerializer


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

        # if request.data.get("variants"):
        #     variants = request.data["variants"]  # Lấy toàn bộ variants ra
        #     for variant in variants:
        #         attributes = []
        #
        #         attrs = variant.pop("attributes") # lấy từng attribute value ra để lưu
        #         for attr in attrs:
        #             attr_obj, _ = Attribute.objects.get_or_create(
        #                 name=attr["name"])  # return (<Attribute: name>, True/False)
        #             attr_value, _ = AttributeValue.objects.get_or_create(
        #                 value=attr["value"],
        #                 attribute=attr_obj,
        #             )  # return (<AttributeValue: value>, True/False)
        #
        #             attributes.append(attr_value.id)
        #
        #         product_variant = ProductVariant.objects.create(
        #             quantity=variant["quantity"],
        #             price=variant["price"],
        #             product=product,
        #         )
        #
        #         if variant.get("logo"):  # dùng get để tránh lỗi KeyError nếu logo không tồn tại
        #             product_variant.logo = variant["logo"]
        #             product_variant.save()
        #
        #         product_variant.attributes.set(attributes)

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


class OrderViewSet(viewsets.ViewSet,generics.CreateAPIView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = serializers.OrderCreateSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return serializers.OrderPartialSerializer
        return super().get_serializer_class()

    def get_permissions(self): # Initilize instance of permission class
        if self.action == 'create':
            self.permission_classes = [perms.IsCustomerOrSeller]
        elif self.action in ['update', 'partial_update','retrieve']:
            self.permission_classes = [perms.IsCustomerOrSeller, perms.OrderUpdatePermission]
        elif self.action == 'destroy':
            self.permission_classes = [perms.IsCustomerOrSeller,perms.OwnerOrderPermission]
        return super().get_permissions()

    def perform_create(self, serializer):
        return serializer.save(customer=self.request.user)

    """
    Save Order to the database
    Create new Order Detail and associate it with Order
    """
    def create(self, request, *args, **kwargs):
       # A customer can not buy a product from its store
       store = Store.objects.get(pk = request.data.get("store"))
       if store.owner == request.user:
           return Response(data={"error_msg" : "Can not by a product from your own store"},status=status.HTTP_400_BAD_REQUEST)
       else:
           products = request.data.pop('products')
           serializer = self.get_serializer(data=request.data)
           serializer.is_valid(raise_exception=True)
           new_order = self.perform_create(serializer) # Get new order just created
           headers = self.get_success_headers(serializer.data)

           #   Create order detail
           for p in products:
               OrderDetail.objects.create(order=new_order,product_variant_id=p.get('product_variant_id'), quantity=p.get('quantity'))


           return Response(serializers.OrderFullSerializer(new_order).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = serializers.OrderUpdateSerializer(instance=instance,data=request.data,partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save() #Choose whether update or create order
        serializerResponse = serializers.OrderPartialSerializer(instance)
        return Response(serializerResponse.data, status=status.HTTP_202_ACCEPTED)


# UserOrder Function based view
"""
    Get list of order that user has ordered with the status as query param
    Ex: user/orders/
        user/orders/?status="PE"
"""


@api_view(['GET'])
@permission_classes([perms.IsCustomerOrSeller])
def userpurchase_list(request):
    if request.query_params.get('status') == None:
        orders = Order.objects.filter(customer=request.user)
    else:
        orders = Order.objects.filter(customer=request.user,
                                      order_status=request.query_params.get('status'))
    serializer = serializers.OrderFullSerializer(orders, many=True)

    if not orders:
        return Response({"msg": "Chưa có đơn hàng"}, status=status.HTTP_404_NOT_FOUND)

    return Response(serializer.data, status=status.HTTP_200_OK)


# StoreOrder Function based view
"""
    Get list of order that a store have with the status as query param
    Ex: store/order/
        store/order/?status="PE"
"""


@api_view(['GET'])
@permission_classes([perms.IsSeller])
def storeorder_list(request):
    if request.query_params.get('status') == None:
        orders = Order.objects.filter(
            store=request.user.store.values_list('id', flat=True)[0])  # Getting id of request.user's store
    else:
        orders = Order.objects.filter(store=request.user.store.values_list('id', flat=True)[0],
                                      order_status=request.query_params.get('status'))
    serializer = serializers.StoreOrderSerializer(orders, many=True)

    if not orders:
        return Response({"msg": "Chưa có đơn hàng"}, status=status.HTTP_400_BAD_REQUEST)

    return Response(serializer.data, status=status.HTTP_200_OK)


"""
    Get all product in the cart in format of basic information
    Use case: When user hover the cart item
"""


def change_cart_detail_active(cart):
    deactive_products = cart.products.filter(active=False)
    for p in deactive_products:
        cart_detail = cart.cartdetail_set.get(product_variant=p)
        cart_detail.active = False
        cart_detail.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_products_in_cart(request):
    cart = Cart.objects.get(user=request.user)
    if cart.total_quantity == 0:
        return Response(data={'msg': 'No product in cart'}, status=status.HTTP_200_OK)
    # Update if product_variant still active or not
    change_cart_detail_active(cart=cart)
    serializer = serializers.CartSerializer(cart)
    return Response(serializer.data, status=status.HTTP_200_OK)


"""
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
        return Response(data={"msg": "Empty Cart !!!"}, status=status.HTTP_200_OK)
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


# Payment process assume user sending selected cart item
# URL /checkout/
"""
    Request body {
        "list_product_variant": [1,2,3....],
        "list_cart_detail": [1,2,3]
    }

    Response
    {
        "user" : {
        "fullname" str,
        "address": { }
        },
        cart_items: [
            {
             "store" : {
                 "id":int, 
                 "name"
             },
             product_variants: [
             {

             }
             ],
             'total_quantity': int,
             'total_price': int
            }
        ],
        payment_method: ['Momo', 'Thanh toan khi nhan hang']
        total_price: int
    }
"""


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
    user = {
        "fullname": request.user.first_name + " " + request.user.last_name,
        "address": request.user.address
    }
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
        for p in products_same_store['product_variants']:
            total_price += p.get('total_price')
        total_quantity = len(products_same_store['product_variants'])
        products_same_store['total_price'] = total_price
        products_same_store['total_quantity'] = total_quantity
        data['cart_items'].append(products_same_store)

        data['payment_method'] = ['ONLINE', 'OFFLINE']
        total_price = 0
        for item in data['cart_items']:
            total_price += item.get('total_price')
        data['total_price'] = total_price

    return Response(data=data, status=status.HTTP_200_OK)


# CartDetail Create Partial-Update Delete
class CartDetailViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.UpdateAPIView, generics.DestroyAPIView):
    queryset = CartDetail.objects.all()
    serializer_class = serializers.CartDetailSerializer
    permission_classes = [perms.IsCustomerOrSeller, perms.OwnerCartDetailPermission]

    def perform_create(self, serializer):
        serializer.save(cart=self.request.user.cart)

    def perform_destroy(self, instance):
        # Before delete a cart detail cart.total_quantity --
        instance.cart.total_quantity -= 1
        instance.cart.save()
        instance.delete()

# Done cart/ , cart-basic-info, checkout
# Create order, orderDetail for each shop, after that remove all the from cart
