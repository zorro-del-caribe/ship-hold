### Query builders

## Select
    
    Parameters: the list of field you want to return (nothing is equivalent to '*')
    Returns: itself
    Example: 
        ```Javascript
        Users
            .select('id','age')
            .build() // {text:'SELECT "id", "age" FROM "users"' values:[]}
        ```
    
### API
    
    * #### Where 
        
        Will add a WHERE clause
        
      Parameters: (leftOperand,[operator],rightOperand) if no operand is provided the default '=' operator is used
      Returns: a proxied Condition builder. You 'll be able to chain with conditional builder specific methods but if you use a method of the main select builder, it will fallback to the main select builder
      Example:
        ```Javascript
        Users
            .select()
            .where('name','laurent')
            .and('age','>',20)
            .build() // {text:'SELECT * FROM "users" WHERE "name"='laurent' AND "age" > 20', values:[]} 
        ```
    * #### orderBy
        
        Will add a ORDER BY clause
    
     Parameters: (property,[direction]). direction can be omitted or either 'desc' or 'asc' 
     Returns: itself
     Example:
     ```Javascript
     Users
        .select()
        .orderBy('age','desc')
        .build() // {text: 'SELECT * FROM "users" ORDER BY "age" DESC', values:[]}
     ```
     * ### limit
     
        Will add a Limit clause
        
     Parameters: (limit, [offset]) offset can be omitted
    Returns: itself
    Example:
    ```Javascript
    Users
        .select()
        .limit(10, 3)
        .build() // {text: 'SELECT * FROM "users" LIMIT 10 OFFSET 3', values:[]}
    ```
    
## Insert

## Update

## Delete

## Condition

## Build and parameters

All builders have the * build * method which return the sql text query and the interpolated values if provided. 

```Javascript
Users
    .select()
    .where('age','>',20)
    .build() // {text: 'SELECT * FROM "users" WHERE "age" > 20', values:[]}
    
Users
    .select()
    .where('age','>','$age')
    .and('name','$laurent')
    .build({age:20, laurent:'Laurent'}) // {text: 'SELECT * FROM "users" WHERE "age" > $1 AND "name" = $2', values:[20,'Laurent']}
```

bla bla sql injection