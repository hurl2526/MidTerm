const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

module.exports = {
  register: async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });
    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });
      // if (user) return res.status(401).json({ msg: 'User already Exists' });
      if (user) {
        req.flash('errors', 'User already exists');
        return res.redirect('/api/users/register');
      }
      user = await new User({ profile: { name }, email, password });
      await user.save().then((user) => {
        req.login(user, (err) => {
          if (err) {
            return res.status(400).json({ confirmation: false, message: err });
          } else {
            next();
            //goes to 
            // res.redirect("/api/users")
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ message: 'Failed', error });
    }
  },

  updateProfile: (params, id) => {
    return new Promise((resolve, reject) => {
      User.findById(id)
        .then((user) => {
          if (params.name) user.profile.name = params.name;
          if (params.email) user.email = params.email;
          if (params.address) user.address = params.address;
          return user;
        })
        .then((user) => {
          user
            .save()
            .then((user) => {
              // return res.redirect(301,'/api/users/profile')
              resolve(user);
            })
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });
  },
  updatePassword: (params, id) => {
    return new Promise((resolve, reject) => {
      User.findById(id)
        .then((user) => {
          const { oldPassword, newPassword, repeatNewPassword } = params;
          if (!oldPassword || !newPassword || !repeatNewPassword) {
            reject('All Inputs Must Be Filled');
          } else if (newPassword !== repeatNewPassword) {
            reject('New Password Do Not Match');
          } else {
            bcrypt
              .compare(oldPassword, user.password)
              .then((match) => {
                if (!match) {
                  reject('Password Not Updated');
                } else {
                  user.password = newPassword;
                  user
                    .save()
                    .then((user) => {
                      resolve(user);
                    })
                    .catch((err) => reject(err));
                }
              })
              .catch((err) => reject(err));
          }
        })
        .catch((err) => reject(err));
    });
  },
};
