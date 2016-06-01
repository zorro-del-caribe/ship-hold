## Model instance

Any query which resolve/stream/etc rows wrap these rows witin a model instance wrapper which provides instance specific methods

```Javascript
Users
    .select()
    .run()
    .then(rows => {
        const firstRow = rows[0];
        // firstRow.save -> Function
        // firstRow.create -> Function
        // firstRow.fetch -> Function
        // firstRow.delete -> Function
    })
```

Alternatively you can create instance manually
```Javascript
    const user = User.new({id:5, name:'Laurent'});
```

### API

* #### fetch 
