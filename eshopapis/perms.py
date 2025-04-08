from rest_framework import permissions
from eshopapis.models import User

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