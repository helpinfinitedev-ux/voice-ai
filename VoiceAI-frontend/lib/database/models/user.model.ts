import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  user_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  photo: { type: String, required: true },
  plan: { type: Object, required: true },
  calendly_integrated: { type: Boolean, required: false },
});

const User = models.User || model('User', UserSchema);

export default User;
