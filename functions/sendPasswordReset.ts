import { getBase44Client } from './_shared/base44Client.ts';

Deno.serve(async (req) => {
  try {
    const base44 = getBase44Client(req);
    
    // Verify admin authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use Base44's built-in password reset functionality
    await base44.auth.resetPasswordForEmail(email);

    // Log the action
    console.log(`Password reset email sent to ${email} by admin ${user.email}`);

    return Response.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return Response.json(
      { error: error.message || 'Failed to send password reset email' },
      { status: 500 }
    );
  }
});