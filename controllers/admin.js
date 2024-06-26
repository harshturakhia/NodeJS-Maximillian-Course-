const { validationResult } = require('express-validator');
const Product = require('../models/product');
const cookies = require('../util/cookie');

module.exports.getAddProduct = (req, res, next) => {

    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        isAuthenticated: req.session.isLoggedIn
    });

};

module.exports.postAddProduct = (req, res, next) => {

    const productTitle = req.body.title;
    const productPrice = req.body.price;
    const productImage = req.file;
    const productDescription = req.body.description;
    const userId = req.session.user._id;
    const errors = validationResult(req);

    if (!productImage) {

        return res
            .status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: false,
                product: {
                    title: productTitle,
                    price: productPrice,
                    description: productDescription
                },
                errorMessage: 'Product image is not set',
                validationErrors: []
            });
    }

    if (!errors.isEmpty()) {
        return res
            .status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: false,
                errorMessage: errors.array().map(error => error.msg),
                product: {
                    title: productTitle,
                    price: productPrice,
                    description: productDescription
                },
                validationErrors: errors.array()
            });
    }

    const product = new Product({
        title: productTitle,
        price: productPrice,
        imageUrl: productImage.path,
        description: productDescription,
        userId: userId,
    });

    product
        .save()
        .then(result => {
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.getProducts = (req, res, next) => {

    let errorMessage = req.flash('error');
    let alertMessage = req.flash('alert');
    let successMessage = req.flash('success');
    let message;
    let messageType;

    if (alertMessage.length > 0) {
        message = alertMessage;
        messageType = 'alert';
    } else if (errorMessage.length > 0) {
        message = errorMessage;
        messageType = 'error';
    } else if (successMessage.length > 0) {
        message = successMessage;
        messageType = 'success';
    } else {
        message = null;
        messageType = null;
    }

    Product
        .find({
            userId: req.user._id
        })
        .then(products => {
            res.render('admin/product-list', {
                pageTitle: 'All Products',
                path: '/admin/products',
                products: products,
                message: message,
                messageType: messageType,
                isAuthenticated: req.session.isLoggedIn,
                validationResult: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

module.exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) return res.redirect('/');
    const productId = req.params.productId;

    Product
        .findById(productId)
        .then(product => {
            if (!product || product.userId.toString() !== req.user._id.toString()) {
                req.flash('alert', 'You can not edit this product information.');
                res.redirect('/admin/products');
            }
            else {
                res.render('admin/edit-product', {
                    pageTitle: product.title,
                    path: '/admin/products',
                    editing: editMode,
                    product: product,
                    isAuthenticated: req.session.isLoggedIn,
                });
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.postEditProduct = (req, res, next) => {
    const productId = req.body.id;
    const productTitle = req.body.title;
    const productPrice = req.body.price;
    const productImage = req.file;
    const productDescription = req.body.description;

    if (!productImage) {

        return res
            .status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: false,
                product: {
                    title: productTitle,
                    price: productPrice,
                    description: productDescription
                },
                errorMessage: 'Product image is not set',
                validationErrors: []
            });
    }

    Product
        .findById(productId)
        .then(product => {
            if (product.userId.toString() === req.user._id.toString()) {
                product.title = productTitle;
                product.price = productPrice;
                product.imageUrl = productImage.path;
                product.description = productDescription;
                return product.save();
            }
            else {
                req.flash('alert', 'You can not edit this product information.');
            }
        })
        .then(result => {
            if (result) req.flash('success', 'Product update successful');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

module.exports.postDeleteProduct = (req, res, next) => {

    const productId = req.body.productId;

    Product
        .findById(productId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found'));
            }
            
            fileHelper.deleteFile(product.imageUrl);
            return Product
                // .findByIdAndRemove(productId) // deprecated without setting 'useFindAndModify: false'
                // .findByIdAndDelete(productId)
                .deleteOne({
                    _id: product._id,
                    userId: product.userId
                });
        })
        .then(result => {
            if (result && result.deletedCount > 0) req.flash('success', 'Product successfully deleted.');
            else req.flash('alert', 'You can not delete this product.');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
