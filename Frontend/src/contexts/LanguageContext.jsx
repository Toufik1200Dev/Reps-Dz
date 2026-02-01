import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Header
    'header.home': 'Home',
    'header.shop': 'Shop',
    'header.programs': 'Programs',
    'header.calculator': 'Calorie Calculator',
    'header.calorieCalculator': 'Calorie Calculator',
    'header.contact': 'Contact Us',
    'header.cart': 'Cart',
    'header.admin': 'Admin',
    'header.logout': 'Logout',
    
    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDesc': 'Looks like you haven\'t added any items to your cart yet.',
    'cart.continueShopping': 'Continue Shopping',
    'cart.items': 'item',
    'cart.itemsPlural': 'items',
    'cart.inCart': 'in your cart',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.tax': 'Tax',
    'cart.total': 'Total',
    'cart.freeShipping': 'Free',
    'cart.freeShippingProgress': 'Free Shipping Progress',
    'cart.addMore': 'Add {amount} DA more for free shipping!',
    'cart.freeShippingQualified': 'You qualify for free shipping!',
    'cart.proceedToCheckout': 'Proceed to Checkout',
    'cart.features.freeShipping': 'Free Shipping',
    'cart.features.securePayment': 'Secure Payment',
    'cart.features.support': '24/7 Support',
    
    // Product Detail
    'product.addToCart': 'Add to Cart',
    'product.buyNow': 'Buy Now',
    'product.outOfStock': 'Out of Stock',
    'product.inStock': 'In Stock',
    'product.lowStock': 'Low Stock',
    'product.lowStockWarning': 'Low stock. Order soon.',
    'product.quantity': 'Quantity',
    'product.size': 'Size',
    'product.color': 'Color',
    'product.description': 'Description',
    'product.specifications': 'Specifications',
    'product.usage': 'Usage',
    'product.noSpecs': 'No specifications available.',
    'product.reviews': 'reviews',
    'product.category': 'Category',
    'product.status': 'Status',
    'product.youMayAlsoLike': 'You May Also Like',
    
    // Order
    'order.title': 'Complete Your Order',
    'order.subtitle': 'Review product details and fill in your information',
    'order.productDetails': 'Product Details',
    'order.clientInfo': 'Client Information',
    'order.fullName': 'Full Name',
    'order.phone': 'Phone Number',
    'order.deliveryType': 'Delivery Type',
    'order.deliveryHome': 'Home',
    'order.deliveryHomeDesc': 'Delivery to your address',
    'order.deliveryStopDesk': 'Stop Desk',
    'order.deliveryStopDeskDesc': 'Pick up from delivery point (30% off)',
    'order.wilaya': 'Wilaya',
    'order.selectWilaya': 'Select Wilaya',
    'order.selectCommune': 'Select Commune',
    'order.commune': 'Commune',
    'order.exactAddress': 'Exact Address',
    'order.exactAddressOptional': '(Optional)',
    'order.exactAddressPlaceholder': 'Street address, building number, apartment, etc.',
    'order.orderSummary': 'Order Summary',
    'order.delivery': 'Delivery',
    'order.placeOrder': 'Place Order',
    'order.processing': 'Processing...',
    'order.confirmed': 'Order Confirmed!',
    'order.successSingle': 'Your order for',
    'order.successMultiple': 'Your order for',
    'order.successEnd': 'has been placed successfully.',
    'order.successItems': 'item',
    'order.successItemsPlural': 'items',
    'order.redirecting': 'Redirecting to homepage...',
    'order.note': 'Note:',
    'order.noteText': 'You will receive a confirmation call after placing your order.',
    'order.required': '*',
    
    // Shop
    'shop.title': 'Shop',
    'shop.filter': 'Filter',
    'shop.sort': 'Sort',
    'shop.allCategories': 'All Categories',
    'shop.priceRange': 'Price Range',
    'shop.search': 'Search products...',
    'shop.noProducts': 'No products found',
    'shop.loading': 'Loading...',
    'shop.sortName': 'Name (A-Z)',
    'shop.sortPriceLow': 'Price (Low to High)',
    'shop.sortPriceHigh': 'Price (High to Low)',
    'shop.sortRating': 'Top Rated',
    'shop.noProductsDesc': 'We couldn\'t find any products matching your filters.',
    
    // Home
    'home.shopByCategory': 'SHOP BY CATEGORY',
    'home.shopByCategoryDesc': 'Find the perfect equipment tailored to your training needs.',
    'home.bestseller': 'Best Seller',
    'home.toprated': 'Top Rated',
    'home.essential': 'Essential',
    'home.builtforathletes': 'Built for Athletes',
    'home.builtforathletesDesc': 'Professional-grade equipment designed by calisthenics experts',
    'home.fastdelivery': 'Fast Delivery',
    'home.fastdeliveryDesc': 'Quick shipping across Algeria - get your gear in 24-48 hours',
    'home.premiumquality': 'Premium Quality',
    'home.premiumqualityDesc': 'Durable, battle-tested materials that last for years',
    'home.localsupport': 'Local Support',
    'home.localsupportDesc': 'Expert customer service in Algeria - we speak your language',
    'home.bestSellers': 'BEST SELLERS',
    'home.topRated': 'Top-rated gear chosen by champions.',
    'home.viewAll': 'View All',
    'home.startJourney': 'Start Your',
    'home.journey': 'Journey',
    'home.journeyDesc': 'Equip yourself with the best tools in the game. Join the movement today.',
    'home.shopNow': 'Shop Now',
    'home.fastShipping': 'Fast Shipping',
    'home.securePayment': 'Secure Payment',
    'home.support24': '24/7 Support',
    
    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'Have a question or need assistance? We\'re here to help!',
    'contact.sendMessage': 'Send Us a Message',
    'contact.name': 'Full Name',
    'contact.email': 'Email Address',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send Message',
    'contact.sending': 'Sending...',
    'contact.phone': 'Phone',
    'contact.location': 'Location',
    'contact.followUs': 'Follow Us',
    'contact.formDesc': 'We\'ll get back to you within 24 hours.',
    'contact.whatsappMessage': 'Hello REPS-DZ! I would like to know more about your products.',
    'contact.subjectPlaceholder': 'How can we help?',
    'contact.messagePlaceholder': 'Your message here...',
    
    // Footer
    'footer.about': 'About',
    'footer.quickLinks': 'Quick Links',
    'footer.contact': 'Contact',
    'footer.followUs': 'Follow Us',
    'footer.rights': 'All rights reserved.',
    
    // Common
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.result': 'Result',
    'common.results': 'Results',
    'common.show': 'Show',
  },
  ar: {
    // Header
    'header.home': 'الرئيسية',
    'header.shop': 'المتجر',
    'header.programs': 'البرامج',
    'header.calculator': 'حاسبة السعرات',
    'header.calorieCalculator': 'حاسبة السعرات',
    'header.contact': 'اتصل بنا',
    'header.cart': 'السلة',
    'header.admin': 'الإدارة',
    'header.logout': 'تسجيل الخروج',
    
    // Cart
    'cart.title': 'سلة التسوق',
    'cart.empty': 'سلة التسوق فارغة',
    'cart.emptyDesc': 'يبدو أنك لم تضيف أي منتجات إلى سلة التسوق بعد.',
    'cart.continueShopping': 'متابعة التسوق',
    'cart.items': 'منتج',
    'cart.itemsPlural': 'منتجات',
    'cart.inCart': 'في سلة التسوق',
    'cart.subtotal': 'المجموع الفرعي',
    'cart.shipping': 'الشحن',
    'cart.tax': 'الضريبة',
    'cart.total': 'الإجمالي',
    'cart.freeShipping': 'مجاني',
    'cart.freeShippingProgress': 'تقدم الشحن المجاني',
    'cart.addMore': 'أضف {amount} دج إضافي للحصول على شحن مجاني!',
    'cart.freeShippingQualified': 'أنت مؤهل للحصول على شحن مجاني!',
    'cart.proceedToCheckout': 'الانتقال إلى الدفع',
    'cart.features.freeShipping': 'شحن مجاني',
    'cart.features.securePayment': 'دفع آمن',
    'cart.features.support': 'دعم 24/7',
    
    // Product Detail
    'product.addToCart': 'أضف إلى السلة',
    'product.buyNow': 'اشتري الآن',
    'product.outOfStock': 'نفدت الكمية',
    'product.inStock': 'متوفر',
    'product.lowStock': 'كمية قليلة',
    'product.lowStockWarning': 'كمية قليلة. اطلب قريباً.',
    'product.quantity': 'الكمية',
    'product.size': 'الحجم',
    'product.color': 'اللون',
    'product.description': 'الوصف',
    'product.specifications': 'المواصفات',
    'product.usage': 'الاستخدام',
    'product.noSpecs': 'لا توجد مواصفات متاحة.',
    'product.reviews': 'تقييمات',
    'product.category': 'الفئة',
    'product.status': 'الحالة',
    'product.youMayAlsoLike': 'قد يعجبك أيضاً',
    
    // Order
    'order.title': 'إتمام الطلب',
    'order.subtitle': 'راجع تفاصيل المنتج واملأ معلوماتك',
    'order.productDetails': 'تفاصيل المنتج',
    'order.clientInfo': 'معلومات العميل',
    'order.fullName': 'الاسم الكامل',
    'order.phone': 'رقم الهاتف',
    'order.deliveryType': 'نوع التوصيل',
    'order.deliveryHome': 'المنزل',
    'order.deliveryHomeDesc': 'التوصيل إلى عنوانك',
    'order.deliveryStopDesk': 'نقطة الاستلام',
    'order.deliveryStopDeskDesc': 'الاستلام من نقطة التوصيل (خصم 30%)',
    'order.wilaya': 'الولاية',
    'order.selectWilaya': 'اختر الولاية',
    'order.selectCommune': 'اختر البلدية',
    'order.commune': 'البلدية',
    'order.exactAddress': 'العنوان الدقيق',
    'order.exactAddressOptional': '(اختياري)',
    'order.exactAddressPlaceholder': 'عنوان الشارع، رقم المبنى، الشقة، إلخ.',
    'order.orderSummary': 'ملخص الطلب',
    'order.delivery': 'التوصيل',
    'order.placeOrder': 'تأكيد الطلب',
    'order.processing': 'جاري المعالجة...',
    'order.confirmed': 'تم تأكيد الطلب!',
    'order.successSingle': 'تم تقديم طلبك لـ',
    'order.successMultiple': 'تم تقديم طلبك لـ',
    'order.successEnd': 'بنجاح.',
    'order.successItems': 'منتج',
    'order.successItemsPlural': 'منتجات',
    'order.redirecting': 'جاري إعادة التوجيه إلى الصفحة الرئيسية...',
    'order.note': 'ملاحظة:',
    'order.noteText': 'ستتلقى مكالمة تأكيد بعد تقديم طلبك.',
    'order.required': '*',
    
    // Shop
    'shop.title': 'المتجر',
    'shop.filter': 'تصفية',
    'shop.sort': 'ترتيب',
    'shop.allCategories': 'جميع الفئات',
    'shop.priceRange': 'نطاق السعر',
    'shop.search': 'ابحث عن المنتجات...',
    'shop.noProducts': 'لم يتم العثور على منتجات',
    'shop.loading': 'جاري التحميل...',
    'shop.sortName': 'الاسم (أ-ي)',
    'shop.sortPriceLow': 'السعر (من الأقل للأعلى)',
    'shop.sortPriceHigh': 'السعر (من الأعلى للأقل)',
    'shop.sortRating': 'الأعلى تقييماً',
    'shop.noProductsDesc': 'لم نتمكن من العثور على أي منتجات تطابق عوامل التصفية الخاصة بك.',
    
    // Home
    'home.shopByCategory': 'تسوق حسب الفئة',
    'home.shopByCategoryDesc': 'ابحث عن المعدات المثالية المصممة لاحتياجاتك التدريبية.',
    'home.bestseller': 'الأكثر مبيعاً',
    'home.toprated': 'الأعلى تقييماً',
    'home.essential': 'أساسي',
    'home.builtforathletes': 'مصمم للرياضيين',
    'home.builtforathletesDesc': 'معدات احترافية مصممة من قبل خبراء الكاليسثينكس',
    'home.fastdelivery': 'توصيل سريع',
    'home.fastdeliveryDesc': 'شحن سريع عبر الجزائر - احصل على معداتك في 24-48 ساعة',
    'home.premiumquality': 'جودة عالية',
    'home.premiumqualityDesc': 'مواد متينة ومختبرة تدوم لسنوات',
    'home.localsupport': 'دعم محلي',
    'home.localsupportDesc': 'خدمة عملاء متخصصة في الجزائر - نتحدث لغتك',
    'home.bestSellers': 'الأكثر مبيعاً',
    'home.topRated': 'أفضل المعدات المختارة من قبل الأبطال.',
    'home.viewAll': 'عرض الكل',
    'home.startJourney': 'ابدأ',
    'home.journey': 'رحلتك',
    'home.journeyDesc': 'جهز نفسك بأفضل الأدوات في اللعبة. انضم إلى الحركة اليوم.',
    'home.shopNow': 'تسوق الآن',
    'home.fastShipping': 'شحن سريع',
    'home.securePayment': 'دفع آمن',
    'home.support24': 'دعم 24/7',
    'home.premiumQuality': 'جودة عالية',
    
    // Contact
    'contact.title': 'اتصل بنا',
    'contact.subtitle': 'هل لديك سؤال أو تحتاج إلى مساعدة؟ نحن هنا للمساعدة!',
    'contact.sendMessage': 'أرسل لنا رسالة',
    'contact.name': 'الاسم الكامل',
    'contact.email': 'عنوان البريد الإلكتروني',
    'contact.subject': 'الموضوع',
    'contact.message': 'الرسالة',
    'contact.send': 'إرسال الرسالة',
    'contact.sending': 'جاري الإرسال...',
    'contact.phone': 'الهاتف',
    'contact.location': 'الموقع',
    'contact.followUs': 'تابعنا',
    'contact.formDesc': 'سنرد عليك في غضون 24 ساعة.',
    'contact.whatsappMessage': 'مرحباً REPS-DZ! أود معرفة المزيد عن منتجاتكم.',
    'contact.subjectPlaceholder': 'كيف يمكننا مساعدتك؟',
    'contact.messagePlaceholder': 'رسالتك هنا...',
    
    // Footer
    'footer.about': 'حول',
    'footer.quickLinks': 'روابط سريعة',
    'footer.contact': 'اتصل',
    'footer.followUs': 'تابعنا',
    'footer.rights': 'جميع الحقوق محفوظة.',
    
    // Common
    'common.back': 'رجوع',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.close': 'إغلاق',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.clear': 'مسح',
    'common.result': 'النتيجة',
    'common.results': 'نتائج',
    'common.show': 'عرض',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const switchLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
