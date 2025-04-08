from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response

from eshopapis.models import Product, Store, User, VerificationSeller
from eshopapis import serializers, perms


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
        if VerificationSeller.objects.filter(user=user, status='PE').exists():
            return Response({"detail": "The request already exists."}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    # save the request with user send request
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# PATCH API for employee accept or reject the request become seller
class ActionVerificationViewSet(viewsets.ViewSet, generics.RetrieveUpdateAPIView):
    queryset = VerificationSeller.objects.all()
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



