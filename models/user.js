const monodb = require('mongodb');

const ObjectId = monodb.ObjectId;

const getDb = require('../util/database').getDb;

class User{
  constructor(username,email,cart,id){
    this.name = username;
    this.email = email;
    this.cart = cart;
    this._id = id;
  }
  save(){
    const db = getDb();
    return db.collection('users').insertOne(this);
  }

  addToCart(product){
    const cartProductIndex = this.cart.items.findIndex(cp => {
      return cp.productId.toString() === product._id.toString();
    })
    let newQuantity = 1;
    const updateCartItems = [...this.cart.items];

    if(cartProductIndex >= 0){
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updateCartItems[cartProductIndex].quantity = newQuantity;
    }else{
      updateCartItems.push({productId: new ObjectId(product._id),quantity:newQuantity})
    }
    const updateCart = {items: updateCartItems}
    const db = getDb()
    return db.collection('users')
      .updateOne({_id: new ObjectId(this._id)},{$set : {cart:updateCart}})
  }

  getCart(){
    const db = getDb()
    const productIds = this.cart.items.map(i => {
      return i.productId;
    })
    return db.collection('products').find({_id: {$in: productIds}}).toArray()
    .then(products => {
      return products.map(p => {
        return {
          ...p,
          quantity: this.cart.items.find(i => {
            return i.productId.toString() === p._id.toString();
          }).quantity
        }
      })
    });
  }

  deleteProductFromCart(productId){
    const updateCartItems = this.cart.items.filter(item => {
      return item.productId.toString() !== productId.toString()
    })
    const db = getDb()
    return db.collection('users')
      .updateOne({_id: new ObjectId(this._id)},{$set : {cart: {items: updateCartItems}}})
  }


  addOrder(){
    const db = getDb()
    return this.getCart()
     .then(products => {
      const order = {
        items: products,
        user: {
          _id: new ObjectId(this._id),
          name: this.name
        }
      }
      return db.collection('orders').insertOne(order)
     })
    .then(result => {
      this.cart = {items: []}
      return db.collection('users')
      .updateOne({_id: new ObjectId(this._id)},{$set : {cart: {items: []}}})
    })
  }

  getOrders(){
    const db = getDb();
    return db.collection('orders').find({'user._id': new ObjectId(this._id)}).toArray()
  }

  static findById(userId){
    const db = getDb();
    return db.collection('users').findOne({_id : new ObjectId(userId)})
      .then(user => {
        console.log(user)
        return user;
      })
      .catch(err => {
          console.log(err)
      })

  }


}

module.exports = User;
