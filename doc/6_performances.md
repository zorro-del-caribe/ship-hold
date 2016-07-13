

## Performances

As very light and using stream as base component, ship-hold performs quite well. There is a [benchmark repository](https://github.com/zorro-del-caribe/ship-hold-benchmark) you can clone and modify to test with you own use cases and hardware which test ship-hold and other libraries in "realistic" use cases.
As any benchmark, it has to be taken with a grain of salt and you should do your own testing before making any claim !
 
### sample result
 
#### Data set

The database created by the fixture script is made of two tables: Users and Products (Users has many products and a product belongs to a user).
There will be 100 000 users and 300 000 products

#### tests

// todo add time to first byte and memory usage ... probably more meaningful when streaming

1. ##### fetch first page
   
   read repeat [ITERATIONS] times "SELECT * FROM users WHERE age > (random) ORDER BY name LIMIT [PAGESIZE]", wait [BREATH] ms and output response time (average, median, best, worst)

   ###### Sample result (for iterations = 200, pageSize=50, breath = 1000)
   
   framework | avg(ms) | worst(ms) | best(ms) | median(ms)
   ----------|---------|-----------|----------|-----------
   ship-hold|25.41|46|14|26
   ship-hold(promise)|24.87|50|13|24
   bookshelf|26.48|75|13|26
   sequelize|27.62|87|15|27
   
2. ##### fetch page including products
   
   same as test 1 but including products 
    
   ###### Sample result (for iterations = 100, pageSize=50, breath = 1000)
   
   framework | avg(ms) | worst(ms) | best(ms) | median(ms)
   ----------|---------|-----------|----------|-----------
   ship-hold|47.26|85|44|46
   ship-hold(promise)|48.57|84|44|47
   bookshelf|48.01|102|42|46
   sequelize|56.43|128|50|55
    
3. ##### get all users

   Load the 100 000 users

   ###### Sample result
   
   framework | response time(ms) 
   ----------|------------------
   ship-hold|811
   ship-hold(promise)|1043
   bookshelf|5756
   sequelize|3309
   



 
 
 
 
 