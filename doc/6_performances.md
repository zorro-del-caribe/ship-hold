

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

   ###### Sample result (for iterations = 100, pageSize=50, breath = 200)
   
   framework | avg(ms) | worst(ms) | best(ms) | median(ms)
   ----------|---------|-----------|----------|-----------
   ship-hold|23.48|44|11|23.5
   ship-hold(promise)|22.01|40|13|22
   bookshelf|25.2|60|14|25
   sequelize|22.2|87|13|21
   
2. ##### fetch page including products
   
   same as test 1 but including products 
    
   ###### Sample result (for iterations = 100, pageSize=50, breath = 200)
   
   framework | avg(ms) | worst(ms) | best(ms) | median(ms)
   ----------|---------|-----------|----------|-----------
   ship-hold|63.95|84|54|64
   ship-hold(promise)|65.08|86|55|65
   bookshelf|91.86|146|82|91
   sequelize|67.25|148|54|64
    
3. ##### get all users

   Load the 100 000 users

   ###### Sample result
   
   framework | avg(ms) | worst(ms) | best(ms) | median(ms)
   ----------|---------|-----------|----------|-----------
   ship-hold|1254|1634|1109|1222
   ship-hold(promise)|1522|2110|1272|1470
   bookshelf|2331.13|3182|1823|2313
   sequelize|1636|2502|1287|1586.5
   



 
 
 
 
 