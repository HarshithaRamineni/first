import Link from "next/link";
import {
    Mail,
    Github,
    Bell,
    BarChart3,
    Zap,
    Shield,
    ArrowRight,
    CheckCircle2,
    Clock,
    Users
} from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold gradient-text">AiXOps</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Features
                        </Link>
                        <Link href="#integrations" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Integrations
                        </Link>
                        <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Pricing
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="btn btn-ghost text-sm">
                            Sign In
                        </Link>
                        <Link href="/login" className="btn btn-gradient text-sm">
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] animate-pulse-slow" />

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-8 animate-in">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-gray-400">AI-Powered Automation for Developers</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-in" style={{ animationDelay: '0.1s' }}>
                        Never Miss a
                        <span className="gradient-text"> Follow-Up</span>
                        <br />Again
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-in" style={{ animationDelay: '0.2s' }}>
                        AiXOps automates your email follow-ups, tracks GitHub activity, and sends smart reminders —
                        so you can focus on building, not admin.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in" style={{ animationDelay: '0.3s' }}>
                        <Link href="/login" className="btn btn-gradient text-lg px-8 py-4">
                            Start Free Trial
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="#features" className="btn btn-secondary text-lg px-8 py-4">
                            Learn More
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/5 animate-in" style={{ animationDelay: '0.4s' }}>
                        <div>
                            <div className="text-3xl font-bold gradient-text">10K+</div>
                            <div className="text-sm text-gray-500 mt-1">Developers</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold gradient-text">500K+</div>
                            <div className="text-sm text-gray-500 mt-1">Reminders Sent</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold gradient-text">99.9%</div>
                            <div className="text-sm text-gray-500 mt-1">Uptime</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Everything You Need to
                            <span className="gradient-text"> Stay on Top</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Powerful features designed specifically for developers and teams who value their time.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature Cards */}
                        <div className="card glass-light hover:border-primary/50 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Email Follow-ups</h3>
                            <p className="text-gray-400">
                                Automatically track unanswered emails and get reminded to follow up at the right time.
                            </p>
                        </div>

                        <div className="card glass-light hover:border-accent/50 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Github className="w-6 h-6 text-accent" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">GitHub Tracking</h3>
                            <p className="text-gray-400">
                                Monitor PRs, issues, and reviews. Never let a code review sit unreviewed again.
                            </p>
                        </div>

                        <div className="card glass-light hover:border-green-500/50 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Bell className="w-6 h-6 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Smart Reminders</h3>
                            <p className="text-gray-400">
                                AI-powered reminders that learn your patterns and notify you at optimal times.
                            </p>
                        </div>

                        <div className="card glass-light hover:border-yellow-500/50 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6 text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Activity Reports</h3>
                            <p className="text-gray-400">
                                Daily and weekly summaries of your team's activity across all platforms.
                            </p>
                        </div>

                        <div className="card glass-light hover:border-blue-500/50 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                            <p className="text-gray-400">
                                Share reminders, delegate tasks, and keep your entire team in sync.
                            </p>
                        </div>

                        <div className="card glass-light hover:border-red-500/50 transition-all duration-300 group">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                            <p className="text-gray-400">
                                SOC 2 compliant with end-to-end encryption. Your data stays yours.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integrations Section */}
            <section id="integrations" className="py-24 px-6 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Seamless
                        <span className="gradient-text"> Integrations</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-12">
                        Connect the tools you already use and love. Set up takes just 2 minutes.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6">
                        <div className="card glass-light px-8 py-6 flex items-center gap-4">
                            <Mail className="w-8 h-8 text-red-400" />
                            <div className="text-left">
                                <div className="font-semibold">Gmail</div>
                                <div className="text-sm text-gray-500">Email tracking</div>
                            </div>
                        </div>
                        <div className="card glass-light px-8 py-6 flex items-center gap-4">
                            <Github className="w-8 h-8 text-white" />
                            <div className="text-left">
                                <div className="font-semibold">GitHub</div>
                                <div className="text-sm text-gray-500">PR & issue tracking</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            How It
                            <span className="gradient-text"> Works</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl font-bold">1</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Connect</h3>
                            <p className="text-gray-400">
                                Link your Gmail and GitHub accounts with secure OAuth authentication.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl font-bold">2</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Configure</h3>
                            <p className="text-gray-400">
                                Set your preferences for reminders, notifications, and summaries.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-500/50 flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl font-bold">3</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Automate</h3>
                            <p className="text-gray-400">
                                Sit back and let AiXOps handle your follow-ups automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="card glass gradient-border p-12 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Automate Your Workflow?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                            Join thousands of developers who are saving hours every week with AiXOps.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/login" className="btn btn-gradient text-lg px-8 py-4">
                                Get Started Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                No credit card required
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                14-day free trial
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">AiXOps</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        © 2025 AiXOps. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
