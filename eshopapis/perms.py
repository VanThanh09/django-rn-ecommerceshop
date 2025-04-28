from rest_framework import permissions
from eshopapis.models import User

class OwnerPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return  super().has_permission(request,view) and obj.user == request.user


class CommentUserPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj): # duoc goi tu get_object() nen co GET, PUT, DELETE
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.user == request.user


class OrderUpdatePermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
            return obj.customer == request.user or obj.store.owner == request.user


class OwnerOrderPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return  super().has_permission(request,view) and obj.customer == request.user


class OwnerCartDetailPermission(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_permission(request,view) and obj.cart == request.user.cart

class IsCustomerOrSeller(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request,view) and (request.user.user_role == User.UserRole.CUSTOMER or request.user.user_role == User.UserRole.SELLER )

class IsCustomer(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.user_role == User.UserRole.CUSTOMER


class IsAdmin(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.user_role == User.UserRole.ADMIN


class IsEmployee(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.user_role == User.UserRole.EMPLOYEE


class IsSeller(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.user_role == User.UserRole.SELLER