import { Request, Response } from 'express';
import { transporter, createContactEmailTemplate } from '../config/email';

// Public endpoint - send email directly
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      res.status(400).json({
        error: 'Name, email, and message are required',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Please provide a valid email address',
      });
      return;
    }

    // Create email template
    const emailOptions = createContactEmailTemplate(name, email, subject, message);

    // Send email
    await transporter.sendMail(emailOptions);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! I\'ll get back to you soon.',
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      error: 'Failed to send message. Please try again later.',
    });
  }
};