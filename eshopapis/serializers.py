from itertools import product

from rest_framework import serializers
from eshopapis.models import Product, Store, User, ProductVariant, AttributeValue, Attribute


# StoreSerializer trả ra thông tin cửa hàng
class StoreSerializer(serializers.ModelSerializer):
    owner = serializers.CharField(source='owner.username')

    class Meta:
        model = Store
        fields = ['id', 'name', 'description', 'owner']


class AttributeSerializer(serializers.ModelSerializer):
    # attribute_value = serializers.CharField(source='attributevalue_set.value')
    attribute_value = serializers.StringRelatedField(many=True, source='attributevalue_set')

    class Meta:
        model = Attribute
        fields = ['name', 'attribute_value']


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source='attribute.name')

    class Meta:
        model = AttributeValue
        fields = ['attribute_name', 'value']


# ProductVariantSerializer trả ra thông tin các biến thể của product ( là product variant)
class ProductVariantSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True)

    class Meta:
        model=ProductVariant
        fields=['id', 'logo', 'quantity', 'price', 'attributes']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        data['logo'] = instance.logo.url

        return data


# ProductSerializer trả ra thông tin product
class ProductSerializer(serializers.ModelSerializer):
    store = StoreSerializer()
    attribute_set = AttributeSerializer(many=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'store', 'attribute_set']


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