from django.contrib import admin
from .models import *


class MyUserAdmin(admin.ModelAdmin):

    # overwrite function save default for hash the password
    def save_model(self, request, obj, form, change):
        # check not change (creat new) and 'password' in form.changed_data ( change the password exist)
        if not change or 'password' in form.changed_data:
            obj.set_password(obj.password) # hass function
        super().save_model(request, obj, form, change) # call function to save


admin.site.register(User, MyUserAdmin)
admin.site.register(Store)
admin.site.register(Product)
admin.site.register(Category)
admin.site.register(Attribute)
admin.site.register(AttributeValue)
admin.site.register(ProductVariant)
admin.site.register(OrderDetail)
admin.site.register(Cart)
admin.site.register(Comment)
admin.site.register(Rating)
