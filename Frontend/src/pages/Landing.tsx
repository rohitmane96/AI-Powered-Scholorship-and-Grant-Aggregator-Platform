import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from 'framer-motion'
import {
  GraduationCap,
  Sparkles,
  Globe,
  Bell,
  FolderOpen,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  Star,
  Twitter,
  Github,
  Linkedin,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'

// ============================================================
// Animated counter
// ============================================================
function AnimatedCounter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, v => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionValue, to, { duration: 2, ease: 'easeOut' })
    return controls.stop
  }, [isInView, motionValue, to])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

// ============================================================
// Floating scholarship card mock
// ============================================================
function FloatingCard({ delay, style, title, provider, score }: {
  delay: number
  style: React.CSSProperties
  title: string
  provider: string
  score: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
      }}
      style={style}
      className="absolute w-56 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-slate-100">{title}</p>
          <p className="text-xs text-slate-500">{provider}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{score}%</p>
          <p className="text-xs text-slate-500">match</p>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: delay + 0.3 }}
          className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
        />
      </div>
    </motion.div>
  )
}

// ============================================================
// Navbar
// ============================================================
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
            🎓
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            ScholarAI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'About'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
            Get Started Free
          </Button>
        </div>
      </div>
    </motion.nav>
  )
}

// ============================================================
// Hero section
// ============================================================
function Hero() {
  const navigate = useNavigate()

  const statsData = [
    { value: 10000, suffix: '+', label: 'Scholarships', prefix: '' },
    { value: 50, suffix: '+', label: 'Countries', prefix: '' },
    { value: 500, suffix: 'Cr+', label: 'Funding Available', prefix: '₹' },
    { value: 95, suffix: '%', label: 'Match Accuracy', prefix: '' },
  ]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-3xl animate-pulse-slow animation-delay-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Floating cards */}
      <div className="absolute inset-0 hidden lg:block pointer-events-none">
        <FloatingCard
          delay={0.5}
          style={{ top: '20%', right: '8%' }}
          title="Rhodes Scholarship"
          provider="University of Oxford"
          score={94}
        />
        <FloatingCard
          delay={1}
          style={{ top: '50%', right: '5%' }}
          title="Fulbright Program"
          provider="US Dept. of State"
          score={78}
        />
        <FloatingCard
          delay={1.5}
          style={{ bottom: '20%', right: '12%' }}
          title="Gates Cambridge"
          provider="Bill & Melinda Gates"
          score={61}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Scholarship Matching</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6"
          >
            <span className="text-slate-100">Find Your</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Perfect Scholarship
            </span>
            <br />
            <span className="text-slate-100">with AI</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl"
          >
            Our AI engine analyzes your profile and matches you with thousands of scholarships
            and grants worldwide — so you spend less time searching and more time applying.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="shadow-2xl shadow-indigo-500/30"
            >
              Get Started Free
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/scholarships')}
            >
              Browse Scholarships
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {statsData.map((stat, i) => (
              <div key={i} className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-black text-slate-100">
                  <AnimatedCounter to={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// How it works
// ============================================================
function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const steps = [
    {
      number: '01',
      icon: '👤',
      title: 'Build Your Profile',
      description: 'Tell us about your education, field of study, GPA, and preferences. Our smart form takes just 5 minutes.',
      color: 'from-indigo-500/20 to-indigo-600/10',
      border: 'border-indigo-500/30',
    },
    {
      number: '02',
      icon: '🤖',
      title: 'AI Matches You',
      description: 'Our NLP-powered AI analyzes thousands of scholarships and creates a personalized match score for each one.',
      color: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/30',
    },
    {
      number: '03',
      icon: '🏆',
      title: 'Apply & Win',
      description: 'Apply directly through our platform with one-click document submission. Track all applications in one place.',
      color: 'from-cyan-500/20 to-cyan-600/10',
      border: 'border-cyan-500/30',
    },
  ]

  return (
    <section id="how-it-works" className="py-24 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="primary" className="mb-4">How It Works</Badge>
          <h2 className="text-4xl font-black text-slate-100 mb-4">
            From Profile to{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Acceptance
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Three simple steps to find and win the scholarships you deserve
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`relative bg-gradient-to-br ${step.color} border ${step.border} rounded-2xl p-8 text-center`}
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 z-10">
                  <ChevronRight className="w-6 h-6 text-slate-600 mx-auto" />
                </div>
              )}

              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="text-xs font-bold text-slate-500 mb-2">{step.number}</div>
              <h3 className="text-xl font-bold text-slate-100 mb-3">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Features grid
// ============================================================
function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI Recommendations',
      description: 'NLP-powered matching engine analyzes your profile against scholarship requirements with 95% accuracy.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Coverage',
      description: 'Access scholarships from 50+ countries spanning all degree levels, fields, and funding types.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Smart Alerts',
      description: 'Never miss a deadline with AI-driven reminders and real-time notifications via WebSocket.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: <FolderOpen className="w-6 h-6" />,
      title: 'Document Manager',
      description: 'Upload, organize, and reuse your documents across multiple applications with secure cloud storage.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'One-Click Apply',
      description: 'Apply to scholarships in seconds using your stored profile and documents. No re-entering info.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Track application status, monitor match scores, and gain insights with beautiful analytics.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
    },
  ]

  return (
    <section id="features" className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge variant="cyan" className="mb-4">Features</Badge>
          <h2 className="text-4xl font-black text-slate-100 mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A complete platform built for students who are serious about funding their education
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300"
            >
              <div className={`${feature.bg} ${feature.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// AI Score visualization
// ============================================================
function AIScoreDemo() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const criteria = [
    { label: 'Country Match', score: 95, icon: '🌍' },
    { label: 'Degree Level', score: 100, icon: '🎓' },
    { label: 'Field of Study', score: 82, icon: '📚' },
    { label: 'GPA Score', score: 76, icon: '📊' },
    { label: 'Funding Type', score: 90, icon: '💰' },
    { label: 'NLP Similarity', score: 88, icon: '🤖' },
  ]

  return (
    <section className="py-24 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <Badge variant="purple" className="mb-4">AI Technology</Badge>
            <h2 className="text-4xl font-black text-slate-100 mb-6">
              Understand Exactly{' '}
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Why You Match
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Our AI doesn't just give you a score — it breaks down every criterion so you know
              exactly where you stand and what to improve.
            </p>
            <div className="space-y-2">
              {[
                'Multi-factor NLP similarity analysis',
                'GPA and academic performance scoring',
                'Country and field-of-study matching',
                'Real-time score updates as you improve your profile',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Score card visualization */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-100">Rhodes Scholarship</h3>
                  <p className="text-sm text-slate-400">University of Oxford</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-emerald-400">
                    <AnimatedCounter to={92} />
                    <span className="text-2xl">%</span>
                  </div>
                  <p className="text-xs text-slate-500">AI Match Score</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Score Breakdown
              </p>

              <div className="space-y-3">
                {criteria.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{c.icon}</span>
                        <span className="text-xs text-slate-400">{c.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${c.score >= 80 ? 'text-emerald-400' : c.score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {c.score}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${c.score}%` } : {}}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${c.score >= 80 ? 'bg-emerald-500' : c.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Stats section
// ============================================================
function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const stats = [
    { value: 10000, suffix: '+', label: 'Scholarships Listed', icon: '🎓' },
    { value: 25000, suffix: '+', label: 'Students Registered', icon: '👥' },
    { value: 3200, suffix: '+', label: 'Applications Submitted', icon: '📝' },
    { value: 89, suffix: '%', label: 'Success Rate', icon: '🏆' },
  ]

  return (
    <section className="py-24 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-950 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black text-slate-100">
            Trusted by Students{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {isInView && <AnimatedCounter to={stat.value} suffix={stat.suffix} />}
              </div>
              <p className="text-slate-400 mt-2 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// CTA section
// ============================================================
function CTA() {
  const navigate = useNavigate()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 gradient-bg-animated opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 to-purple-950/80" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Start Your Journey Today
          </h2>
          <p className="text-slate-300 text-xl mb-10 leading-relaxed">
            Join thousands of students who've already discovered their perfect scholarships.
            Your dream education is just one click away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="shadow-2xl shadow-indigo-500/40"
            >
              Create Free Account
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/scholarships')}
            >
              Explore Scholarships
            </Button>
          </div>
          <p className="text-slate-500 text-sm mt-6">
            No credit card required • Free forever for students
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================
// Footer
// ============================================================
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                🎓
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ScholarAI
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              AI-powered scholarship discovery platform helping students find and win funding worldwide.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: 'Platform',
              links: ['Browse Scholarships', 'AI Recommendations', 'My Applications', 'Documents'],
            },
            {
              title: 'Resources',
              links: ['Scholarship Guide', 'Application Tips', 'Blog', 'FAQ'],
            },
            {
              title: 'Company',
              links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'],
            },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-slate-300 mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            © 2026 ScholarAI. All rights reserved. Built for final year college project.
          </p>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm text-slate-500">Made with passion for education</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================================
// Main Landing page
// ============================================================
export default function Landing() {
  return (
    <div className="bg-slate-950 text-slate-100">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <AIScoreDemo />
      <Stats />
      <CTA />
      <Footer />
    </div>
  )
}
