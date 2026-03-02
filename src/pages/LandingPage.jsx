import { useState } from 'react';
import { ArrowRight, Star, CheckCircle, Users, Zap, Award, TrendingUp, Globe, Lock, Smartphone } from 'lucide-react';
import { backendClient } from '@/api/backendClient';

export default function LandingPage({ onNavigate }) {
  const [email, setEmail] = useState('');

  const handleSignup = () => backendClient.auth.redirectToLogin();
  const handleLogin = () => backendClient.auth.redirectToLogin();

  const features = [
    { icon: Zap, title: 'Easy Tasks', description: 'Complete simple tasks and earn money instantly' },
    { icon: TrendingUp, title: 'Grow Your Income', description: 'VIP levels unlock higher commissions and bonuses' },
    { icon: Users, title: 'Referral Program', description: 'Earn 20% commission from every referral' },
    { icon: Award, title: 'Achievements', description: 'Unlock badges and rewards for milestones' },
    { icon: Globe, title: 'Global Access', description: 'Available worldwide with multiple languages' },
    { icon: Lock, title: 'Secure & Safe', description: 'Your data is encrypted and protected' }
  ];

  const testimonials = [
    { name: 'Alex M.', text: 'Made $500 in my first month! Easy and fun.', vip: 'Gold' },
    { name: 'Sarah K.', text: 'The VIP system is amazing. Highly recommend!', vip: 'Platinum' },
    { name: 'John D.', text: 'Best side income platform I\'ve used.', vip: 'Silver' }
  ];

  const pricingPlans = [
    { name: 'Bronze', level: 'Free', features: ['Unlimited tasks', 'Basic support', '5% commission'], color: 'from-orange-400' },
    { name: 'Silver', level: 'Premium', features: ['Priority tasks', '24/7 support', '7% commission', 'Exclusive content'], color: 'from-gray-300', popular: true },
    { name: 'Gold', level: 'Premium+', features: ['VIP tasks', 'Priority support', '10% commission', 'Monthly bonuses'], color: 'from-yellow-300' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-4 border-red-600 flex items-center justify-center bg-red-50">
              <span className="text-red-600 font-bold text-lg" style={{ fontFamily: 'serif' }}>t</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Trampoline</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLogin}
              className="px-6 py-2 text-gray-700 font-medium hover:text-gray-900"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleSignup}
              className="px-6 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">Earn Money by Completing Tasks</h1>
          <p className="text-xl text-gray-600 mb-8">Join thousands of users earning daily by completing simple, fun tasks. No experience needed.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              type="button"
              onClick={handleSignup}
              className="px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Earning Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleLogin}
              className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-full font-bold text-lg hover:border-gray-400 transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-4xl font-bold text-red-600">50K+</div>
              <div className="text-gray-600 text-sm">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600">$2.5M</div>
              <div className="text-gray-600 text-sm">Paid Out</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600">4.8★</div>
              <div className="text-gray-600 text-sm">User Rating</div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl h-96 flex items-center justify-center text-white text-lg font-medium">
            Dashboard Preview
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Trampoline?</h2>
            <p className="text-xl text-gray-600">Everything you need to start earning today</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="p-8 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VIP Levels Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">VIP Levels</h2>
            <p className="text-xl text-gray-600">Unlock higher earnings as you complete more tasks</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].slice(0, 3).map((level, idx) => (
              <div key={idx} className={`p-8 bg-white rounded-2xl border-2 ${idx === 1 ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-200'} ${idx === 1 ? 'transform scale-105' : ''}`}>
                {idx === 1 && <div className="text-center bg-red-600 text-white py-1 rounded-full text-sm font-bold mb-4">MOST POPULAR</div>}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{level}</h3>
                <div className="text-3xl font-bold text-red-600 mb-6">{['$0', '$100', '$500'][idx]}+</div>
                <ul className="space-y-3">
                  {[`${5 + idx * 2}% commission`, `${3 + idx * 2} task refreshes`, idx === 0 ? 'Email support' : idx === 1 ? '24/7 chat support' : 'Priority support'][idx] && (
                    <>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        {`${5 + idx * 2}% commission`}
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        {`${3 + idx * 2} daily refreshes`}
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        {['Email support', '24/7 chat support', 'Priority support'][idx]}
                      </li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Users Say</h2>
            <p className="text-xl text-gray-600">Join our community of successful earners</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="p-8 bg-white rounded-2xl border border-gray-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{testimonial.vip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Earning?</h2>
          <p className="text-xl text-red-100 mb-8">Join thousands of users and start completing tasks today</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={handleSignup}
              className="px-8 py-4 bg-white text-red-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={handleLogin}
              className="px-8 py-4 border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full border-3 border-red-600 flex items-center justify-center bg-red-50">
                  <span className="text-red-600 font-bold text-sm" style={{ fontFamily: 'serif' }}>t</span>
                </div>
                <span className="font-bold text-white">Trampoline</span>
              </div>
              <p className="text-sm">Earn money by completing tasks</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button type="button" className="hover:text-white transition-colors">Features</button></li>
                <li><button type="button" className="hover:text-white transition-colors">Pricing</button></li>
                <li><button type="button" className="hover:text-white transition-colors">Security</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><button type="button" className="hover:text-white transition-colors">About</button></li>
                <li><button type="button" className="hover:text-white transition-colors">Blog</button></li>
                <li><button type="button" className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><button type="button" className="hover:text-white transition-colors">Terms</button></li>
                <li><button type="button" className="hover:text-white transition-colors">Privacy</button></li>
                <li><button type="button" className="hover:text-white transition-colors">Cookies</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Trampoline. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}