from rest_framework import serializers
from eshopapis.models import Product, Store, User, ProductVariant, AttributeValue, VerificationSeller, Category, \
    CartDetail, Cart, Order, OrderDetail, CommentImage, CommentUser, CommentSeller, StoreRating


# StoreSerializer trả ra thông tin cửa hàng
class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'description', 'owner', 'logo']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['logo'] = instance.logo.url

        return data


# UserSerializer trả ra thông tin của user
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'password', 'email', 'avatar', 'user_role']
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


# Trả ra thông tin user khi người khác xem
class InfoUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'avatar']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['avatar'] = instance.avatar.url

        return data


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
        fields = ['id', 'logo', 'quantity', 'price', 'active', 'attributes']

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
        variant = obj.productvariant_set.order_by('price').first()

        if variant and variant.price is not None:
            min_price = variant.price
            return str("{:,.0f}".format(min_price))

        return "0"

    def get_total_quantity(self, obj):
        total = 0
        for variant in obj.productvariant_set.all():
            total += variant.quantity
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
        variant  = obj.productvariant_set.order_by('price').first()

        if variant and variant.price is not None:
            min_price = variant.price
            return str("{:,.0f}".format(min_price))

        return "0"


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

# ==============================================================================================

# Same with ProductVariantSerializer but add with product name
class ProductVariantWithProductNameSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)
    product_name = serializers.StringRelatedField(source="product.name")
    stock_quantity = serializers.IntegerField(source="quantity")

    class Meta:
        model=ProductVariant
        fields = ['id', 'product_name', 'logo', 'price', 'attributes', 'stock_quantity']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['logo'] = instance.logo.url

        return data


# Serializer of OrderDetail using in OrderFullSerializer
class OrderDetailSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    store = serializers.SerializerMethodField()
    product_variant = serializers.SerializerMethodField()

    def get_product(self, obj):
        product = obj.product_variant.product
        return {
            "id": product.id,
            "name": product.name,
            "logo": product.logo.url
        }

    def get_store(self, obj):
        return {
            "id": obj.store.id,
            "name": obj.store.name,
            "logo": obj.store.logo.url
        }

    def get_product_variant(self, obj):
        attributes = AttributeValueSerializer(obj.product_variant.attributes.all(), many=True).data

        return {
            "id": obj.product_variant.id,
            "logo": obj.product_variant.logo.url,
            "price": obj.product_variant.price,
            "attributes": attributes
        }

    class Meta:
        model = OrderDetail
        fields = ['product','store','product_variant','order_status','quantity']


class OrderDetailUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderDetail
        fields = ['id','order_status']
        read_only_fields = ('id',)


# Serializer for creating order
class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['store', 'order_status','payment_method','total_price']

# Serializer only update order status of Order
class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['paid']


# Serializer only serialize every things but basic form
class OrderSerializer(serializers.ModelSerializer):
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


class OrderStoreSerializer(OrderDetailSerializer):
    def get_customer(self,obj):
        customer = obj.order.customer
        return {
            "id": customer.id,
            "username": customer.username,
            "avatar": customer.avatar.url
        }
    # Dynamically define fields for the model serializer
    def get_fields(self):
        fields = super().get_fields()

        fields['customer'] = serializers.SerializerMethodField()
        fields['payment_method'] = serializers.CharField(source='order.payment_method')

        # Remove the 'store' field
        fields.pop('store', None)

        return fields


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


class CartDetailGetProductsForCart(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source='product_variant.id', read_only=True)
    class Meta:
        model = CartDetail
        fields = ['variant_id', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    product_variants = CartDetailGetProductsForCart(source="cartdetail_set", many=True, read_only=True)

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
        read_only_fields = ('id','cart', 'active')

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


class CommentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentImage
        fields = '__all__'
        read_only_fields = ('id')


class CommentImageReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentImage
        fields = ['id','image']
        read_only_fields = ('id', 'image')

    def to_representation(self, instance):
        if instance is not None:
            data = super().to_representation(instance)
            data['image'] = instance.image.url
            return data


class UserCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'avatar']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Safely handle avatar URL
        if instance.avatar:  # Checks both None and empty file
            try:
                data['avatar'] = instance.avatar.url
            except ValueError:
                # FileField/ImageField exists but no file is attached
                data['avatar'] = None
        else:
            data['avatar'] = None

        return data


class ProductVariantCommentSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)
    class Meta:
        model = ProductVariant
        fields = ['attributes']


class CommentUserViewSerializer(serializers.ModelSerializer):
    user = UserCommentSerializer(read_only=True)
    product_variant = ProductVariantCommentSerializer(read_only=True)
    image_list = serializers.SerializerMethodField()
    rep_cmt = serializers.SerializerMethodField()

    def get_image_list(self, obj):
        image_list = obj.image_list.all()
        if image_list.exists():
            return CommentImageReadSerializer(image_list,many=True, context=self.context).data
        return []

    def get_rep_cmt(self,obj):
        # Kiểm tra sự tồn tại của `rep_cmt`
        if hasattr(obj, 'rep_cmt') and obj.rep_cmt:
            return obj.rep_cmt.content
        return ''
    class Meta:
        model = CommentUser
        fields = ['user','id','product_variant','content','like','rating','image_list','created_date','rep_cmt']


class CommentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentUser
        fields = ['id','content','rating','like']
        read_only_field = ('id')


class CommentSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentSeller
        fields = '__all__'
        read_only_fields = ('id','rep_cmt','seller',)

############################ Rating Store ###################

class StoreRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreRating
        fields = '__all__'
        read_only_fields = ('id','user',)

########################## Store in product detail Page ######

class StoreProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id','name','logo','store_address', 'owner']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['logo'] = instance.logo.url

        return data