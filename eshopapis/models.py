from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    # Các vài trò người dùng trong hệ thống
    class UserRole(models.TextChoices):
        ADMIN = "AD", _("ADMIN") # Người quản trị hệ thống
        EMPLOYEE = "EM", _("EMPLOYEE") # Nhân viên của sàn giao dịch
        SELLER = "SE", _("SELLER") # Người dùng sau khi đăng kí là người bán hàng trên sàn
        CUSTOMER = "CUS", _("CUSTOMER") # Khách hàng

    avatar = CloudinaryField(null=True)
    user_role = models.CharField(max_length=3, choices=UserRole, default=UserRole.CUSTOMER)
    address = models.JSONField(null=True, default=dict, blank=True)
    phone_number = models.CharField(max_length=10, null=True, unique=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class VerificationSeller(models.Model):
    class RequestStatus(models.TextChoices):
        PENDING = 'PE', _("PENDING")
        ACCEPT = 'AC', _("ACCEPT")
        REJECTED = 'RE', _("REJECTED")

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_request')
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=2, choices=RequestStatus, default=RequestStatus.PENDING)
    reason = models.TextField(null=True, blank=True)
    employee = models.ForeignKey(User, on_delete=models.PROTECT, related_name='employee', null=True, blank=True)

    temp_store_name = models.CharField(max_length=255)
    temp_store_description = models.TextField()
    temp_store_logo = CloudinaryField(null=True)
    temp_store_address = models.CharField(max_length=400)
    temp_owner_name = models.CharField(max_length=255)
    temp_owner_ident = models.CharField(max_length=20)

    class Meta:
        unique_together = ['status', 'user']

    def __str__(self):
        return str(self.temp_store_name)


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    logo = CloudinaryField(null=True, blank=True)

    class Meta:
        abstract = True


class Store(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    store_address = models.CharField(max_length=400)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)  # Chủ sở hữu cửa hàng
    owner_name = models.CharField(max_length=255)
    owner_ident = models.CharField(max_length=20)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ('owner',)


class Product(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField()
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, blank=True)  # Sản phẩm thuộc cửa hàng nào

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=255)
    products = models.ManyToManyField('Product',
                                      blank=True)  # Một danh mục chứa nhiều sản phẩm, sản phẩm tộc nhiều danh mục
    logo = CloudinaryField(null=True, blank=True)

    def __str__(self):
        return self.name


class Attribute(models.Model):
    name = models.CharField(max_length=255)  # Tên thuộc tính (màu sắc, size...)

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    value = models.CharField(max_length=255)  # Giá trị của thuộc tính (ví dụ: đỏ, xanh, L, M...)
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE)  # Tên  thuộc tính của giá trị đó

    def __str__(self):
        return self.value


class ProductVariant(BaseModel):
    quantity = models.IntegerField(default=0)
    price = models.FloatField(default=0)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)  # Thuộc về sản phẩm nào
    attributes = models.ManyToManyField('AttributeValue', blank=True)  # Các giá trị thuộc tính của biến thể

    def __str__(self):
        attributeValues = self.attributes.all()
        allValues = ' - '.join([f'{a.attribute.name}: {a.value}' for a in attributeValues])

        return f"{self.product.name} - {allValues} - Tồn kho: {self.quantity} - Giá: {"{:,.0f}".format(self.price)} VND"


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        ONLINE = 'ON', _("ONLINE") # Thanh toán online ngay khi bắt đầu mua
        OFFLINE = 'OF', _("OFFLINE") # Thanh toán sau khi nhận được hàng

    created_date=models.DateTimeField(auto_now_add=True)
    payment_method=models.CharField(max_length=2, choices=PaymentMethod) # Phương thức thanh toán
    total_price=models.FloatField(default=0)
    customer=models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="customer_orders")
    paid = models.BooleanField(default=False)
    shipping_address = models.JSONField(null=True, default=dict)


class OrderDetail(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'PE', _("PENDING")  # Khi sản phẩm bắt được khách hàng xác nhận mua
        SUCCESS = 'SU', _("SUCCESS")  # Sau khi khách hàng xác nhận đã nhận được hàng
        SHIPPING = 'SH', _("SHIPPING")  # Sản phẩm đã rời khỏi kho của người bán
        CANCEL = 'CA', _("CANCEL")  # Khách hàng hủy đơn khi đang ở PENDING, khách không nhận hàng, ....

    quantity=models.IntegerField(default=1)
    order=models.ForeignKey(Order, on_delete=models.CASCADE) # Thuộc order nào
    product_variant=models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True) # Biến thể sản phẩm nào
    order_status = models.CharField(max_length=2, choices=OrderStatus, default='PE')  # Trạng thái đơn hàng
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, related_name="store_orders")
    is_commented= models.BooleanField(default=False)


class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, related_name="payments")
    request_id = models.CharField(max_length=50)
    order_payment_id = models.CharField(max_length=50)
    amount = models.FloatField(default=0)
    created_date = models.DateTimeField(auto_now_add=True)
    portal_payment = models.CharField(max_length=30, default="MOMO")
    payment_status = models.BooleanField(default=False)


class Cart(models.Model):
    total_quantity = models.IntegerField(default=0)
    user=models.OneToOneField(User, on_delete=models.CASCADE)
    products = models.ManyToManyField(ProductVariant, through='CartDetail', related_name="carts")


from django.core.validators import MinValueValidator, MaxValueValidator


class CartDetail(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    product_variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField(validators=[MinValueValidator(0)],default=0)
    active = models.BooleanField(default=True)  # Khi sản phẩm hết số lượng,hoặc bị xóa ,active=False, không thể mua sản phẩm này dù con trong giỏ hàng


class CommentUser(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, null=False)
    content=models.TextField() # Nội dung bình luận
    product_variant = models.ForeignKey("ProductVariant", on_delete=models.CASCADE, null=False, related_name='comments')
    rating = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)],default=5)
    like = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment id {self.id} {self.user.username} - {self.product_variant.id} - {self.like}"


class CommentImage(models.Model):
    image = CloudinaryField(null=False)
    comment = models.ForeignKey(CommentUser,on_delete=models.CASCADE, null=False, related_name='image_list')


class CommentSeller(models.Model):
    seller = models.ForeignKey('User', on_delete=models.CASCADE, null=False)
    content=models.TextField() # Nội dung bình luận
    rep_cmt = models.OneToOneField('CommentUser', null=False, on_delete=models.CASCADE, related_name='rep_cmt')

    def __str__(self):
        return f"{self.seller.username} reply {self.rep_cmt.id}"


class ProductRating(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, null=False)
    rating = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)],default=5)
    product = models.ForeignKey(Product, null = False, on_delete=models.CASCADE)


class StoreRating(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, null=False)
    rating = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(5)],default=5)
    store = models.ForeignKey(Store, null = False, on_delete=models.CASCADE)