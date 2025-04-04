from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from eshopapis.models import Product, Store, User
from eshopapis import serializers


# Create new user
class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True).all()
    serializer_class = serializers.UserSerializer


# Return list of all product
class ProductViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Product.objects.filter(active=True)
    serializer_class = serializers.ProductSerializer

    # # return all variant of 1 product
    # @action(methods=['get'], detail=True, url_path='product_variant')
    # def get_product_variant(self, request, pk):
    #     product_variant = self.get_object().productvariant_set.filter(active=True)
    #
    #     return Response(serializers.ProductVariantSerializer(product_variant, many=True).data, status=status.HTTP_200_OK)


# Return detail of product ( all variant of product)
class ProductDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Product.objects.filter(active=True)
    serializer_class = serializers.ProductDetailSerializer


# Return a store detail
class StoreDetailViewSet(viewsets.ViewSet, generics.RetrieveAPIView):
    queryset = Store.objects.filter(active=True)
    serializer_class = serializers.StoreSerializer

    # Return all product of a store
    @action(methods=['get'], detail=True, url_path='products')
    def get_products(self, request, pk):
        products = self.get_object().product_set.filter(active=True)

        return Response(serializers.ProductSerializer(products, many=True).data, status=status.HTTP_200_OK)
