from django.contrib import admin
from .models import *

admin.site.register(User)
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

