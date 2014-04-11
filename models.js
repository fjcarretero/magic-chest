var User;

function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;

  /**
    * Model: User
    */
  function validatePresenceOf(value) {
    return value && value.length;
  }

  User = new Schema({
    'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'familyId': { type: String, validate: [validatePresenceOf, 'a familyId is required'] },
    'name': String,
    'role': { type: String, validate: [validatePresenceOf, 'a role is required'] }
  });

  User.virtual('id').get(function() {
      return this._id.toHexString();
  });


  mongoose.model('User', User);

  fn();
}

exports.defineModels = defineModels;
