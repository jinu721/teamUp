import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    MessageSquare,
    Shield,
    Zap,
    Code,
    Rocket,
    Globe,
    Briefcase,
    Building2,
    HeartHandshake,
    CheckCircle2,
    Terminal,
    Search,
    Sparkles,
    Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Landing() {
    return (
        <div className="min-h-screen bg-background selection:bg-primary/10">
            <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <span className="text-2xl font-black tracking-tighter">TEAMUP</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
                        <a href="#solutions" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Solutions</a>
                        <a href="#community" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Community</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
                        </Link>
                        <Link to="/register">
                            <Button size="sm" className="font-medium px-5 rounded-full">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">

                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
                </div>

                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h1 className="text-5xl lg:text-8xl font-black tracking-tight leading-[0.9] text-foreground animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            Build Your Next <br />
                            Great Idea Together.
                        </h1>
                        <p className="text-lg lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            The collective playground for all who want to <span className="text-foreground font-bold underline decoration-primary/30">Team Up</span>. Whether you are an Open Source contributor, individual collaborator, company team, or freelance group—manage your projects and build the future together.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                            <Link to="/register">
                                <Button size="lg" className="h-14 px-8 text-base font-semibold rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
                                    Launch Your Workshop <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/community">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold rounded-full hover:bg-muted/50 transition-all">
                                    Explore Community
                                </Button>
                            </Link>
                        </div>

                        <div className="relative mt-16 lg:mt-24 p-2 bg-muted/30 border border-border/50 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-1000 delay-500">
                            <div className="bg-background rounded-[2rem] overflow-hidden border shadow-inner">
                                <img
                                    src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80"
                                    alt="Dashboard Preview"
                                    className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                            </div>

                            <div className="absolute -top-6 -right-6 lg:-right-12 p-5 bg-background border rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                                <div className="h-10 w-10 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Project Status</p>
                                    <p className="text-sm font-bold">100% Completed</p>
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -left-6 lg:-left-12 p-5 bg-background border rounded-2xl shadow-xl flex items-center gap-4 animate-float">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                            U{i}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Now</p>
                                    <p className="text-sm font-bold">12 Collaborators</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 mt-24">
                    <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter opacity-70"><Globe className="h-6 w-6" /> OPEN SOURCE</div>
                        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter opacity-70"><Building2 className="h-6 w-6" /> CORPORATE</div>
                        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter opacity-70"><Briefcase className="h-6 w-6" /> FREELANCE</div>
                    </div>
                </div>
            </section>

            <section id="solutions" className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-4xl lg:text-6xl font-black tracking-tight">Tailored For Your Workflow</h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">Whether you're building alone or managing a global enterprise, Team Up adapts to you.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Open Source Card */}
                        <div className="group relative p-10 bg-gradient-to-br from-card to-background border border-border/50 rounded-[3rem] overflow-hidden hover:border-primary/50 transition-all duration-500 hover:shadow-2xl shadow-primary/5">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                                <Code className="h-32 w-32" />
                            </div>
                            <div className="relative space-y-6">
                                <div className="h-14 w-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                    <Code className="h-8 w-8" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight">Open Source Contribution</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Discover trending projects, connect with maintainers, and contribute with ease. Built-in versioning awareness and collaboration tools for the modern developer.
                                </p>
                                <ul className="space-y-3">
                                    {['Discoverable Projects', 'Issue Tracking', 'Maintainer Roles', 'Public Community'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm font-medium">
                                            <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Company Card */}
                        <div className="group relative p-10 bg-gradient-to-br from-card to-background border border-border/50 rounded-[3rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl shadow-blue-500/5">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                                <Building2 className="h-32 w-32" />
                            </div>
                            <div className="relative space-y-6">
                                <div className="h-14 w-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                                    <Building2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight">Enterprise Management</h3>
                                <h4 className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-[-1rem]">Corporate Grade</h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    Manage your engineering teams with precision. Granular RBAC, audit logs, and workshop-level visibility controls for secure internal collaboration.
                                </p>
                                <ul className="space-y-3">
                                    {['Role Based Access Control', 'Detailed Audit Logs', 'Team Hierarchy', 'Workshop Analytics'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm font-medium">
                                            <CheckCircle2 className="h-4 w-4 text-blue-500" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Freelance Card */}
                        <div className="group relative p-10 bg-gradient-to-br from-card to-background border border-border/50 rounded-[3rem] overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl shadow-purple-500/5">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                                <Briefcase className="h-32 w-32" />
                            </div>
                            <div className="relative space-y-6">
                                <div className="h-14 w-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                                    <Briefcase className="h-8 w-8" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight">Freelance Hub</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Organize your clients and projects in dedicated workshops. Track tasks, share media, and communicate in real-time without context switching.
                                </p>
                                <ul className="space-y-3">
                                    {['Client Workshops', 'Task Milestones', 'Media Sharing', 'Instant Messaging'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm font-medium">
                                            <CheckCircle2 className="h-4 w-4 text-purple-500" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Developer Collab Card */}
                        <div className="group relative p-10 bg-gradient-to-br from-card to-background border border-border/50 rounded-[3rem] overflow-hidden hover:border-orange-500/50 transition-all duration-500 hover:shadow-2xl shadow-orange-500/5">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform">
                                <Terminal className="h-32 w-32" />
                            </div>
                            <div className="relative space-y-6">
                                <div className="h-14 w-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center">
                                    <HeartHandshake className="h-8 w-8" />
                                </div>
                                <h3 className="text-3xl font-black tracking-tight">Collab Finder</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Looking for a co-founder or a pairing partner? Use our community finder to search for developers with specific skills and kickstart your project.
                                </p>
                                <ul className="space-y-3">
                                    {['Skill-based Search', 'Developer Profiles', 'Direct Messaging', 'Global Community'].map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm font-medium">
                                            <CheckCircle2 className="h-4 w-4 text-orange-500" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Everything You Need To Build</h2>
                        <p className="text-muted-foreground">Modern tools integrated into a single seamless experience.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Layout className="h-6 w-6" />,
                                title: "Workshop Architecture",
                                description: "The core unit of collaboration. Manage your entire ecosystem within nested workshops and localized permissions.",
                                color: "bg-black/5 text-black dark:bg-white/10 dark:text-white"
                            },
                            {
                                icon: <MessageSquare className="h-6 w-6" />,
                                title: "Next-Gen Chat",
                                description: "Real-time communication with message threading, replies, voice notes, and project-specific channels.",
                                color: "bg-black/5 text-black dark:bg-white/10 dark:text-white"
                            },
                            {
                                icon: <Search className="h-6 w-6" />,
                                title: "Global Finder",
                                description: "Advanced search for public workshops, specific projects, and skilled developers across the platform.",
                                color: "bg-black/5 text-black dark:bg-white/10 dark:text-white"
                            },
                            {
                                icon: <Zap className="h-6 w-6" />,
                                title: "Dynamic Tasking",
                                description: "Integrated board and task tracking with real-time updates for everyone involved in the project.",
                                color: "bg-black/5 text-black dark:bg-white/10 dark:text-white"
                            },
                            {
                                icon: <Shield className="h-6 w-6" />,
                                title: "Granular RBAC",
                                description: "Enterprise-grade role-based access control with detailed permission inheritance across teams.",
                                color: "bg-black/5 text-black dark:bg-white/10 dark:text-white"
                            },
                            {
                                icon: <Rocket className="h-6 w-6" />,
                                title: "Project Lifecycle",
                                description: "From ideation to deployment, manage every stage of your project with specialized tooling.",
                                color: "bg-black/5 text-black dark:bg-white/10 dark:text-white"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 bg-background border border-border/50 rounded-[2rem] hover:shadow-xl hover:-translate-y-1 transition-all group">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm", feature.color)}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="relative rounded-[3rem] overflow-hidden bg-primary px-8 py-16 lg:py-24 text-center text-primary-foreground shadow-2xl shadow-primary/20">

                        <div className="absolute top-0 right-0 w-[30%] h-[100%] bg-white/5 skew-x-12 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-[40%] h-[100%] bg-black/5 -skew-x-12 -translate-x-1/2" />

                        <div className="relative max-w-3xl mx-auto space-y-8">
                            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Ready to Team Up?</h2>
                            <p className="text-primary-foreground/80 text-lg">
                                Join thousands of developers and creators building the future together. <br className="hidden lg:block" />
                                Start your workshop for free today.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/register">
                                    <Button size="lg" variant="secondary" className="h-14 px-10 text-base font-bold rounded-full hover:scale-105 transition-all">
                                        Get Started Free
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button size="lg" variant="ghost" className="h-14 px-10 text-base font-bold text-white hover:bg-white/10 rounded-full">
                                        Sign In to Account
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-lg font-bold">TEAM UP</span>
                        </Link>
                        <div className="flex items-center gap-8">
                            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Twitter</a>
                            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">GitHub</a>
                            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Discord</a>
                        </div>
                    </div>
                    <div className="text-center pt-8 border-t border-border/10">
                        <p className="text-xs text-muted-foreground opacity-60">
                            © {new Date().getFullYear()} Team Up Platform. All rights reserved. Built with passion for collaboration.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}