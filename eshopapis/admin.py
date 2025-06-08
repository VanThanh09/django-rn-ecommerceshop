import json
from datetime import timedelta
from django.contrib import admin
from django.urls import reverse
from django.utils.html import mark_safe
from django.utils import timezone
from .models import *
from django.db.models import Min, Sum, Count, F
from django.db.models.functions import TruncMonth

class MyAdminSite(admin.AdminSite):
    site_header = 'ADMIN PAGE'
    index_title = 'Admin Dashboard'

    def each_context(self, request):
        context = super().each_context(request)

        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_year = now - timedelta(days=365)

        user_per_month = (
            User.objects
            .filter(date_joined__gte=last_year)
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        labels = [entry['month'].strftime('%Y-%m') for entry in user_per_month]
        counts = [entry['count'] for entry in user_per_month]
        context['user_chart_labels'] = json.dumps(labels)
        context['user_chart_data'] = json.dumps(counts)

        context['total_products'] = Product.objects.count()

        context['sold_products'] = OrderDetail.objects.filter(order_status=OrderDetail.OrderStatus.SUCCESS).aggregate(
            total_sold = Sum('quantity')
        )['total_sold'] or 0

        context['sold_products_30_days'] = OrderDetail.objects.filter(
            order_status=OrderDetail.OrderStatus.SUCCESS,
            order__created_date__gte=last_30_days).aggregate(
            total_sold = Sum('quantity')
        )['total_sold'] or 0

        context['total_users'] = User.objects.count()
        context['total_stores'] = Store.objects.count()

        context['total_order'] = Order.objects.count()
        context['total_order_30_days'] = Order.objects.filter(created_date__gte=last_30_days).count()

        revenue_30_days = OrderDetail.objects.filter(
            order_status = OrderDetail.OrderStatus.SUCCESS,
            order__created_date__gte=last_30_days
        ).aggregate(
            total_price=Sum("product_variant__price")
        )['total_price'] or 0

        revenue_1_year = OrderDetail.objects.filter(
            order_status = OrderDetail.OrderStatus.SUCCESS,
            order__created_date__gte=last_year
        ).aggregate(
            total_price=Sum("product_variant__price")
        )['total_price'] or 0

        context.update({
            'revenue_30_days': "{:,.0f}".format(revenue_30_days),
            'revenue_1_year': "{:,.0f}".format(revenue_1_year)
        })

        top_categories = list(
            Category.objects.annotate(product_count=Count('products'))
            .order_by('-product_count')
            .values('name', 'product_count')[:5]
        )

        context['top_categories'] = top_categories

        labels = [entry['name'] for entry in top_categories]
        counts = [entry['product_count'] for entry in top_categories]
        context['cate_chart_labels'] = json.dumps(labels)
        context['cate_chart_data'] = json.dumps(counts)

        revenue_by_store = list(OrderDetail.objects.filter(
            order_status=OrderDetail.OrderStatus.SUCCESS,
            product_variant__price__isnull=False,
            store__isnull=False
        ).values('store__id', 'store__name', 'store__logo').annotate(
            total_revenue=Sum(F('quantity') * F('product_variant__price'))
        ).order_by('-total_revenue'))[:5]

        context.update({
                'top_store': [
                    (
                        store['store__id'],
                        store['store__name'],
                        store['store__logo'],
                        "{:,.0f}".format(store['total_revenue'] or 0)
                    )
                    for store in revenue_by_store
                ]
        })

        return context


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
                <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
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
            products = obj.product_set.annotate(price=Min('productvariant__price')).all()
            product_links = "".join(
                [
                    f"""
                    <div style="width: 400px; margin: 10px; box-sizing: border-box; border: 1px solid #ccc; padding: 5px; border-radius: 6px;">
                        <a href="/admin/eshopapis/product/{p.id}/change/" style="display: flex;" style="color: inherit;text-decoration: none;">
                            <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
                                <img src="{p.logo.url}" style="width:100%; height:100%; object-fit:cover;" />
                            </div>
                            <div style="margin: 10px;">  
                                <div style="align-items: center; height: 30px; width: 100%; font-weight: bold; color: black; opacity: 0.8;"> {p.name}  </div>
                                <div style="align-items: center; height: 30px; width: 100%; color: black"> {p.description}  </div>
                                <div style="align-items: center; height: 30px; width: 100%; color: black"> {f"{int(p.price):,}"} vnđ</div>
                            </div>
                        </a>
                    </div>
                    """ for p in products]
            )

            return mark_safe(
                f"""
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
                        {product_links}
                    </div>
                """)

        else:
            return "No product"

    logo_view.short_description = "Logo"
    owner_view.short_description = "Owner"
    store_view.short_description = "STORE"
    count_product.short_description = "PRODUCTS"
    product_view.short_description = "Products"


class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'count_product']

    def count_product(self, obj):
        return f"{obj.products.count()} SẢN PHẨM"

    count_product.short_description = "PRODUCTS"


class UserAdmin(admin.ModelAdmin):
    readonly_fields = ['avatar_view']

    # overwrite function save default for hash the password
    def save_model(self, request, obj, form, change):
        # check not change (creat new) and 'password' in form.changed_data ( change the password exist)
        if not change or 'password' in form.changed_data:
            obj.set_password(obj.password)  # hass function

        super().save_model(request, obj, form, change)  # call function to save

    def avatar_view(self, obj):
        if obj.avatar:
            return mark_safe(
                f"""
                <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
                    <img src="{obj.avatar.url}" style="width:100%; height:100%; object-fit:cover;" />
                </div>
                """
            )
        return "No avatar"


class ProductAdmin(admin.ModelAdmin):
    fields = ['active', 'logo_view', 'name', 'description', 'product_variant_view']
    readonly_fields = ['logo_view', 'product_variant_view']

    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = 'Chỉnh sửa sản phẩm' if object_id else 'Thêm sản phẩm mới'
        return super().changeform_view(request, object_id, form_url, extra_context=extra_context)

    def logo_view(self, obj):
        if obj.logo.url:
            return mark_safe(
                f"""
                <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
                    <img src="{obj.logo.url}" style="width:100%; height:100%; object-fit:cover;" />
                </div>
                """
            )
        else:
            return "No image"

    def product_variant_view(self, obj):
        if obj.productvariant_set:
            variant = obj.productvariant_set.all()
            variant_view = ""

            for v in variant:
                attributes = v.attributes.all()
                attributes_view = "".join([f"""<div style="align-items: center; margin: 5px; width: 100%; color: black"> {a.attribute.name}: {a.value} </div>""" for a in attributes])

                variant_view += f"""
                    <div style="width: 400px; margin: 10px; box-sizing: border-box; border: 1px solid #ccc; padding: 5px; border-radius: 6px; display: flex">
                            <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
                                <img src="{v.logo.url}" style="width:100%; height:100%; object-fit:cover;" />
                            </div>
                            <div style="margin: 5px;">  
                                <div style="align-items: center; margin: 0px 5px 5px 5px; width: 100%; font-weight: bold; color: black; opacity: 0.8;">Giá: {f"{int(v.price):,}"}  </div>
                                <div style="align-items: center; margin: 5px; width: 100%; color: black">Số lượng: {v.quantity}  </div>
                                {attributes_view}
                                </div>
                    </div>
                    """

            return mark_safe(
                f"""
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
                        {variant_view}
                    </div>
                """)
        else:
            return "No variant"

    product_variant_view.short_description = "Biến thể sản phẩm:"


class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'total_price', 'payment_method', 'created_date', 'customer_view']
    list_display_links = ['id', 'total_price', 'payment_method']
    fields = ['payment_method', 'total_price', 'customer_view', 'order_detail_view']
    readonly_fields = ['customer_view', 'order_detail_view']

    def customer_view(self, obj):
        if obj.customer:
            # Tạo URL chỉnh sửa user (owner) trong Django Admin
            customer_edit_url = reverse('admin:eshopapis_user_change', args=[obj.customer.id])

            return mark_safe(
                f"""
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="{obj.customer.avatar.url}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; border: 1px solid #ccc;" />
                    <a href="{customer_edit_url}">
                        <span>{obj.customer.first_name} {obj.customer.last_name}</span>
                    </a>
                </div>
                """
            )
        return "No owner"

    def order_detail_view(self, obj):
        if obj.orderdetail_set:
            order_detail = obj.orderdetail_set.select_related('product_variant').all()
            order_detail_view = ""

            for od in order_detail:
                attributes = od.product_variant.attributes.all()
                attributes_view = " - ".join([f""" {a.attribute.name}: {a.value} """ for a in attributes])
                url = reverse('admin:eshopapis_product_change', args=[od.product_variant.product.id])

                order_detail_view += f"""
                    <div style="width: 400px; margin: 10px; box-sizing: border-box; border: 1px solid #ccc; padding: 5px; border-radius: 6px; display: flex">
                        <a href="{url}" style="display: flex;" style="color: inherit;text-decoration: none;">
                            <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
                                <img src="{od.product_variant.logo.url}" style="width:100%; height:100%; object-fit:cover;" />
                            </div>
                            <div style="margin: 5px;">  
                                <div style="align-items: center; margin: 0px 5px 5px 5px; width: 100%; font-weight: bold; color: black; opacity: 0.8;">{od.product_variant.product.name}  </div>
                                <div style="align-items: center; margin: 0px 5px 5px 5px; width: 100%; font-weight: bold; color: black; opacity: 0.8;">Giá: {f"{int(od.product_variant.price):,}"}  </div>
                                <div style="align-items: center; margin: 5px; width: 100%; color: black">Số lượng: {od.quantity}  </div>
                                <div style="align-items: center; margin: 5px; width: 100%; color: black"> {attributes_view} </div>
                            </div>
                        </a>
                    </div>
                    """

            return mark_safe(
                f"""
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
                        {order_detail_view}
                    </div>
                """)

        else:
            return "No order detail"

    customer_view.short_description = "Customer"
    order_detail_view.short_description = "Order Detail"


class VerificationSellerAdmin(admin.ModelAdmin):
    list_display = ['temp_store_name', 'status_view', 'owner_view']
    fields = ['owner_view', 'status_view', 'created_date', 'temp_store_name', 'temp_store_logo_view', 'temp_store_description', 'temp_store_address', 'employee']
    readonly_fields = ['created_date' ,'owner_view', 'status_view', 'temp_store_name', 'temp_store_description', 'temp_store_address', 'temp_store_logo_view', 'employee']

    def owner_view(self, obj):
        if obj.user:
            # Tạo URL chỉnh sửa user (owner) trong Django Admin
            owner_edit_url = reverse('admin:eshopapis_user_change', args=[obj.user.id])

            return mark_safe(
                f"""
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="{obj.user.avatar.url}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid #ccc;" />
                    <a href="{owner_edit_url}">
                        <span>{obj.user.first_name} {obj.user.last_name}</span>
                    </a>
                </div>
                """
            )
        return "No owner"

    def status_view(self, obj):
        if obj.status == VerificationSeller.RequestStatus.PENDING:
            return "Đang chờ xác nhận"

        if obj.status == VerificationSeller.RequestStatus.ACCEPT:
            return "Chấp nhận"

        if obj.status == VerificationSeller.RequestStatus.REJECTED:
            return "Từ chối"

    def temp_store_logo_view(self, obj):
        if obj.temp_store_logo.url:
            return mark_safe(
                f"""
                <div style="width:100px; height:100px; overflow:hidden; border:1px solid gray;">
                    <img src="{obj.temp_store_logo.url}" style="width:100%; height:100%; object-fit:cover;" />
                </div>
                """
            )
        else:
            return "No image"


    owner_view.short_description = "Owner"
    status_view.short_description = "Status"
    temp_store_logo_view.short_description = "Logo"


admin_site.register(User, UserAdmin)
admin_site.register(Store, StoreAdmin)
admin_site.register(VerificationSeller, VerificationSellerAdmin)
admin_site.register(Product, ProductAdmin)
# admin_site.register(ProductVariant)
admin_site.register(Category, CategoryAdmin)
admin_site.register(Order, OrderAdmin)
