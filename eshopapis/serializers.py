from rest_framework import serializers
from eshopapis.models import Product, Store, User, ProductVariant, AttributeValue, VerificationSeller, Category, \
    Attribute, CartDetail, Cart, Order, OrderDetail


# StoreSerializer trả ra thông tin cửa hàng
class StoreSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source='owner.username')

    class Meta:
        model = Store
        fields = ['id', 'name', 'description', 'owner']


# UserSerializer trả ra thông tin của user
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'username', 'password', 'email', 'avatar', 'user_role']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    # Ghi đè create để băm mật khẩu khi tạo
    def create(self, validated_data):
        data = validated_data.copy()

        user = User(**data)
        user.set_password(user.password)
        user.save()

        return user

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['avatar'] = instance.avatar.url

        return data


# # AttributeSerializer trả ra thông tin tên của attribute
# class AttributeSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Attribute
#         fields = ['name']


# AttributeValueSerializer trả ra thông tin tên và giá trị của attribute ( Màu sắc - Đen, Size - XL)
class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source='attribute.name')

    class Meta:
        model = AttributeValue
        fields = ['attribute_name', 'value']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'logo']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if data['logo']:
            data['logo'] = instance.logo.url

        return data


# ProductVariantSerializr trả ra thông tin các biến thể của một product (thông tin chi tiết)
class ProductVariantSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)

    class Meta:
        model = ProductVariant
        fields = ['id', 'logo', 'quantity', 'price', 'attributes']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if data['logo']:
            data['logo'] = instance.logo.url

        return data


class ProductDetailSerializer(serializers.ModelSerializer):
    """Xem chi tiết toàn bộ thông tin của một sản phẩm"""
    productvariant_set = ProductVariantSerializer(many=True)
    store = StoreSerializer()
    attributes = serializers.SerializerMethodField()
    category_set = CategorySerializer(many=True)
    price = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'store', 'price', 'total_quantity', 'logo', 'category_set', 'attributes', 'productvariant_set']

    def get_attributes(self, obj):
        """Tạo danh sách thuộc tính của tất cả biến thể"""
        attributes = {}
        for variant in obj.productvariant_set.all():  # product_variant
            for attr_value in variant.attributes.all():  # attribute_value
                attr_name = attr_value.attribute.name  # lấy attribute name
                if attr_name not in attributes:  # kiểm tra attribute name đã tốn tại trong set chưa
                    attributes[attr_name] = set()  # nếu chưa thì tạo mới
                attributes[attr_name].add(
                    attr_value.value)  # nếu đã có rồi thì chỉ cần thêm value vào attribute name đó

        # Chuyển `set` thành `list` để trả về JSON
        return {key: list(values) for key, values in attributes.items()}

    def get_price(self, obj):
        price = [variant.price for variant in obj.productvariant_set.all()]
        return str("{:,.0f}".format(min(price)))

    def get_total_quantity(self, obj):
        total = 0
        for variant in obj.productvariant_set.all():
            total += variant.quantity
            print(total)
        return total


    def to_representation(self, instance):
        data = super().to_representation(instance)

        if data['logo']:
            data['logo'] = instance.logo.url

        return data


# ProductSerializer trả ra thông tin cho toàn bộ product (home)
class ProductSerializer(serializers.ModelSerializer):
    # store = serializers.CharField(source='store.name')
    price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'logo', 'price']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['logo'] = instance.logo.url

        return data

    def get_price(self, obj):
        min_price = obj.productvariant_set.order_by('price').first().price
        return str("{:,.0f}".format(min_price))


# ProductSerializer thông tin chờ xác thực seller
class VerificationSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationSeller
        fields = ['id', 'user', 'status', 'created_date', 'reason', 'temp_store_name', 'temp_store_description',
                  'temp_store_logo', 'temp_store_address', 'temp_owner_name', 'temp_owner_ident']
        read_only_fields = ['user', 'created_date']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['temp_store_logo'] = instance.temp_store_logo.url

        return data


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'logo', 'store', 'category_set', 'productvariant_set']


# Same with ProductVariantSerializer but add with product name
class ProductVariantWithProductNameSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)
    product_name = serializers.StringRelatedField(source="product.name")
    class Meta:
        model=ProductVariant
        fields=['id', 'product_name' ,'logo',  'price', 'attributes']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['logo'] = instance.logo.url

        return data


# Serializer of OrderDetail using in OrderFullSerializer
class OrderDetailSerializer(serializers.ModelSerializer):
    product_variant = ProductVariantWithProductNameSerializer(read_only=True)
    class Meta:
        model = OrderDetail
        fields = ['product_variant','quantity']

# Serializer for creating order
class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['store', 'order_status','payment_method','total_price']

# Serializer only update order status of Order
class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['order_status']

# Serializer only serialize every things but basic form
class OrderPartialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"

# Serializer for full Response Order
class OrderFullSerializer(serializers.ModelSerializer):
    products = OrderDetailSerializer(read_only=True,many=True, source="orderdetail_set")
    store = StoreSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ['id','customer','products','store','total_price','order_status','created_date']


# Serializer Response for store/orders
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username']

class StoreOrderSerializer(serializers.ModelSerializer):
    products = OrderDetailSerializer(read_only=True,many=True, source="orderdetail_set")
    order_id = serializers.IntegerField(source='id')
    customer = CustomerSerializer(read_only=True)
    class Meta:
        model = Order
        fields = ['order_id','customer','products','total_price','order_status','created_date']

# Cart Serializer
# Support serializer for serializing cart
class CartProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name']
        read_only_fields = ('id','name',)

class CartBasicProductVariantSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    class Meta:
        model = ProductVariant
        fields = ['product', 'logo', 'price']
        read_only_fields = ('logo','price')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['logo'] = instance.logo.url
        return data

# I override this to remove the info about the owner of the store
class CartStoreSerializer(StoreSerializer):
    class Meta(StoreSerializer.Meta):
        fields = ['id', 'name']
        read_only_fields = ('id', 'name',)


class CartProductVariantSerializer(serializers.ModelSerializer):
    product_variant = ProductVariantWithProductNameSerializer(read_only=True)
    cart_detail = serializers.IntegerField(source='id')
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartDetail
        fields = ['cart_detail','product_variant','active','quantity','total_price']
        read_only_fields = ('active','quantity','cart_detail',)

    def get_total_price(self,obj):
        return obj.product_variant.price * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    product_variants = CartBasicProductVariantSerializer(many=True,source='products',read_only=True)
    class Meta:
        model = Cart
        fields = ['id','product_variants','total_quantity']
        read_only_fields = ('id', 'total_quantity')


# CartDetailSerializer
class CartDetailSerializer(serializers.ModelSerializer):
    cart_total_quantity = serializers.IntegerField(source='cart.total_quantity', read_only=True)
    class Meta:
        model = CartDetail
        fields = ['id','product_variant', 'quantity','active','cart','cart_total_quantity']
        read_only_fields = ('id','cart',)

    # Orverride create method that check if product_variant is already exist then just update
    def create(self, validated_data):
        """
        {
            cart = cart,
            product_variant = 1,
            quantity = 1
        }
        """
        cart = validated_data.pop('cart')
        cartDetail, created = CartDetail.objects.get_or_create(cart=cart,product_variant=validated_data.get('product_variant'))
        cartDetail.quantity += validated_data.get('quantity')
        if created:
            cart.total_quantity += 1
        cartDetail.save()
        cart.save()

        return cartDetail