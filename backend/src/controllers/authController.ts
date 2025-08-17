import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User from '../models/User';

function isValidEmail(email: string): boolean {
  return /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test(email);
}

export const signup = async (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword });
    await user.save();
    return res.json({ token: 'token', user: { fullName, email } });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    return res.json({ token: 'token', user: { fullName: user.fullName, email: user.email } });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const { email, fullName, newEmail } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and full name are required.' });
  }
  try {
    // If newEmail is provided and different, update both email and fullName
    const updateFields: any = { fullName };
    if (newEmail && newEmail !== email) {
      updateFields.email = newEmail;
    }
    const user = await User.findOneAndUpdate(
      { email },
      updateFields,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: { fullName: user.fullName, email: user.email } });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password changed successfully.' });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  try {
    const result = await User.deleteOne({ email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ message: 'Account deleted successfully.' });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
  }
};
