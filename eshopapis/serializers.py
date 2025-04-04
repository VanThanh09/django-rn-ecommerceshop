from itertools import product

from rest_framework import serializers
from eshopapis.models import Product, Store, User, ProductVariant, AttributeValue, Attribute


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
        fields = ['first_name', 'last_name', 'username', 'password', 'email', 'avatar']
        extra_kwargs = {
            'password' : {
                'write_only': True
            }
        }

    # Ghi đè create để băm mật khẩu khi tạo
    def create(self, validated_data):
        data= validated_data.copy()

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
#
#     class Meta:
#         model = Attribute
#         fields = ['name']


# AttributeValueSerializer trả ra thông tin tên và giá trị của attribute ( Màu sắc - Đen, Size - XL)
class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source='attribute.name')

    class Meta:
        model = AttributeValue
        fields = ['attribute_name', 'value']


# eProductVariantSerializr trả ra thông tin các biến thể của một product (thông tin chi tiết)
class ProductVariantSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)

    class Meta:
        model=ProductVariant
        fields=['id', 'logo', 'quantity', 'price', 'attributes']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['logo'] = instance.logo.url

        return data


class ProductDetailSerializer(serializers.ModelSerializer):
    productvariant_set=ProductVariantSerializer(many=True)
    store = StoreSerializer()
    attributes = serializers.SerializerMethodField()

    class Meta:
        model=Product
        fields = ['id', 'name', 'description', 'store', 'attributes', 'productvariant_set']

    def get_attributes(self, obj):
        """Tạo danh sách thuộc tính của tất cả biến thể"""
        attributes = {}
        for variant in obj.productvariant_set.all(): # product_variant
            for attr_value in variant.attributes.all():  # attribute_value
                attr_name = attr_value.attribute.name # lấy attribute name
                if attr_name not in attributes: # kiểm tra attribute name đã tốn tại trong set chưa
                    attributes[attr_name] = set() # nếu chưa thì tạo mới
                attributes[attr_name].add(attr_value.value) # nếu đã có rồi thì chỉ cần thêm value vào attribute name đó


        # Chuyển `set` thành `list` để trả về JSON
        return {key: list(values) for key, values in attributes.items()}


# ProductSerializer trả ra thông tin product + các biến thể ( variant)
class ProductSerializer(serializers.ModelSerializer):
    store = StoreSerializer()
    # attribute_set = AttributeSerializer(many=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'store']