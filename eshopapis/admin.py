from django.contrib import admin
from django.urls import reverse
from django.utils.html import mark_safe
from .models import *


class MyAdminSite(admin.AdminSite):
    site_header = 'ADMIN PAGE'
    site_title = 'Admin Panel'
    index_title = 'Welcome to Admin Dashboard'

admin_site = MyAdminSite(name='eShop')


class StoreAdmin(admin.ModelAdmin):
    list_display = ['store_view', 'owner', 'count_product']
    fields = ['active', 'logo_view', 'name', 'owner_view', 'description', 'product_view']
    readonly_fields = ['logo_view', 'owner_view', 'product_view']
    search_fields = ['name']
    list_display_links = ['store_view']

    def logo_view(self, obj):
        if obj.logo.url:
            return mark_safe(
                f"""
                <div style="width:100px; height:100px; overflow:hidden; border-radius:50%; border:1px solid gray;">
                    <img src="{obj.logo.url}" style="width:100%; height:100%; object-fit:cover;" />
                </div>
                """
            )
        else:
            return "No image"

    def owner_view(self, obj):
        if obj.owner:
            # Tạo URL chỉnh sửa user (owner) trong Django Admin
            owner_edit_url = reverse('admin:eshopapis_user_change', args=[obj.owner.id])

            return mark_safe(
                f"""
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="{obj.owner.avatar.url}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid #ccc;" />
                    <a href="{owner_edit_url}">
                        <span>{obj.owner.first_name} {obj.owner.last_name}</span>
                    </a>
                </div>
                """
            )
        return "No owner"

    def store_view(self, obj):
        if obj:
            return mark_safe(
                f"""
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="{obj.logo.url}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid #ccc;" />
                    <span>{obj.name}</span>
                </div>
                """
            )
        return "No store"

    def count_product(self, obj):
        if obj.product_set:
            return f"{obj.product_set.count()} SẢN PHẨM"
        else:
            return "No product"

    def product_view(self, obj):
        if obj.product_set:
            products = obj.product_set.all()
            product_links = [
                f"""
                <a href="/admin/eshopapis/product/{p.id}/change/" style="display: flex;" style="color: inherit;">
                <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
                    <img src="{p.logo.url}" style="width:100%; height:100%; object-fit:cover;" />
                </div>
                <div style="margin: 10px;">  
                <div style="align-items: center; height: 30px; width: 100%; font-weight: bold; color: 'black'"> {p.name}  </div>
                <div style="align-items: center; height: 30px; width: 100%"> {p.description}  </div>
                </div>
                </a>
                """ for p in products]
            return mark_safe("<br>".join(product_links))
        else:
            return "No product"

    logo_view.short_description = "Logo"
    owner_view.short_description = "Owner"
    store_view.short_description = "STORE"
    count_product.short_description = "PRODUCTS"
    product_view.short_description = "Products"


admin_site.register(User)
admin_site.register(Store, StoreAdmin)
admin_site.register(VerificationSeller)
admin_site.register(Product)
admin_site.register(ProductVariant)
admin_site.register(Category)
admin_site.register(Order)
