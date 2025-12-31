from rest_framework.pagination import PageNumberPagination

class JobPagination(PageNumberPagination):
    page_size = 10                     # default page size
    page_size_query_param = "size"    
    max_page_size = 50