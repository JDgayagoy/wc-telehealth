import Link from 'next/link';
import styles from './landing.module.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export default function Home() {
  return (
    <>
      <div className={`${styles.page} ${plusJakarta.className}`}>

        {/* ── HERO ── */}
        <header className={styles.hero}>
          <div className={styles.heroMedia}>
            <img src="/image/doctor_consultation.jpg" className={styles.heroImg} alt="Doctor" />
          </div>
          <div className={styles.heroOverlay} />

          <div className={styles.heroInner}>
            <nav className={styles.nav}>
              <Link className={styles.brand} href="/">
                <span className={styles.brandMark}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s-7-4.35-9.5-8.5C.9 9.7 2.3 6 5.8 6c2 0 3.2 1.1 4.2 2.4C11 7.1 12.2 6 14.2 6c3.5 0 4.9 3.7 3.3 6.5C19 16.65 12 21 12 21Z" fill="#fff" />
                  </svg>
                </span>
                TeleHealth
              </Link>

              <ul className={styles.navLinks}>
                <li><a href="#">Home</a></li>
                <li><a href="#services">Find a provider</a></li>
                <li><a href="#news">Find care</a></li>
                <li><a href="#community">Location</a></li>
                <li><a href="#services">Medical Service</a></li>
              </ul>

              <Link
                href="/register"
                className={`${styles.btn} ${styles.btnGhostLight}`}
              >
                Get Started
              </Link>

              <button className={styles.navToggle} aria-label="Menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </nav>

            <div className={styles.heroContent}>
              <span className={styles.heroEyebrow}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                Consult top doctors anytime,<br />from any location.
              </span>
              <h1 className={styles.heroH1}>
                Expert Health Consultations Anytime, Anywhere
              </h1>
              <p className={styles.heroSub}>
                Access top-tier health consultations from the comfort of your home or on the go. Our platform connects you with experienced medical professionals around the clock.
              </p>
            </div>

            <div className={styles.heroPlay}>
              <button className={styles.playPill}>
                <span className={styles.playIco}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                Start Video
              </button>
            </div>
          </div>
        </header>

        {/* ── SERVICES ── */}
        <section className={styles.sectionPad} id="services">
          <div className={styles.container}>
            <div className={styles.servicesSurface}>
              <div className={styles.servicesMedia}>
                <div className={styles.servicesMediaInner}>
                  <img src={"/image/wellness.webp"} className={styles.imgPlaceholderServices}>

                  </img>
                </div>
                <div className={styles.mediaPlay}>
                  <button className={styles.mediaPlayBtn}>Play<br />Video</button>
                </div>
              </div>

              <div className={styles.servicesBody}>
                <span className={styles.badge}>Our Specialist</span>
                <h2>Health Services for Your Well-being</h2>
                <p className={styles.servicesLead}>
                  We provide an extensive array of health services designed to cater to your unique health needs.
                </p>

                <div className={styles.featureGrid}>
                  <div className={styles.feature}>
                    <span className={styles.featureIco}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <rect x="4" y="3" width="16" height="18" rx="2" />
                        <path d="M8 8h8M8 12h8M8 16h5" />
                      </svg>
                    </span>
                    <h4>General Check-ups and Physical Exams</h4>
                    <p>Our comprehensive physical exams include evaluations of vital signs, physical examinations, and discussions about your health history, lifestyle, and any concerns you may have.</p>
                  </div>
                  <div className={styles.feature}>
                    <span className={styles.featureIco}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                      </svg>
                    </span>
                    <h4>Chronic Disease Management</h4>
                    <p>Our approach includes regular monitoring, personalized treatment plans, lifestyle modification support, and education to help you understand and manage your chronic conditions.</p>
                  </div>
                </div>

                <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>
                  More Service
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEWS ── */}
        <section className={styles.sectionPad} id="news">
          <div className={styles.container}>
            <div className={styles.eyebrowCenter}>
              <span className={styles.badge}>News and Tips</span>
              <h2 className={styles.sectionTitle}>Latest Health News and Tips</h2>
              <p className={styles.sectionLead}>
                Stay informed with the latest updates, expert advice, and practical tips to keep you healthy and well.
              </p>
            </div>

            <div className={styles.newsGrid}>
              <article className={styles.newsCard}>
                <div className={styles.newsCardMedia}>
                  <img src="/image/fruit.jpg" className={styles.imgPlaceholderNews}></img>
                  <span className={styles.readMore}>Read More</span>
                </div>
                <div className={styles.chips}>
                  <span className={styles.chip}>Wellness</span>
                  <span className={styles.chip}>Nutrition</span>
                  <span className={styles.chip}>Immunity</span>
                </div>
                <h3>Boost Your Immunity with These Superfoods</h3>
                <p>Discover the top superfoods that can enhance your immune system and help you stay healthy year round.</p>
              </article>

              <article className={styles.newsCard}>
                <div className={styles.newsCardMedia}>
                  <img src='/image/runningwebp.webp' className={styles.imgPlaceholderNews}></img>
                  <span className={styles.readMore}>Read More</span>
                </div>
                <div className={styles.chips}>
                  <span className={styles.chip}>Fitness</span>
                  <span className={styles.chip}>Mental Health</span>
                  <span className={styles.chip}>Lifestyle</span>
                </div>
                <h3>The Benefits of Regular Exercise for Mental Health</h3>
                <p>Learn how incorporating physical activity into your daily routine can improve your mood, reduce stress, and boost mental clarity.</p>
              </article>

              <article className={styles.newsCard}>
                <div className={styles.newsCardMedia}>
                  <img src="/image/sleep.webp" className={styles.imgPlaceholderNews}></img>
                  <span className={styles.readMore}>Read More</span>
                </div>
                <div className={styles.chips}>
                  <span className={styles.chip}>Sleep Health</span>
                  <span className={styles.chip}>Wellness</span>
                  <span className={styles.chip}>Lifestyle</span>
                </div>
                <h3>Healthy Sleep Habits: Tips for a Restful Night</h3>
                <p>Explore effective strategies for improving your sleep quality and achieving a restful night&apos;s sleep.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── COMMUNITY ── */}
        <section className={styles.sectionPad} id="community">
          <div className={styles.container}>
            <div className={styles.communitySurface}>
              <div className={styles.eyebrowCenter}>
                <span className={styles.badge}>Community</span>
                <h2 className={styles.sectionTitle}>Creating Wellness Together</h2>
                <p className={styles.sectionLead}>
                  We provide the resources and connections you need to thrive. Let&apos;s create a healthier future, together.
                </p>
              </div>

              <div className={styles.commRows}>
                {/* Row 1: image left, text right */}
                <div className={styles.commRow}>
                  <div className={styles.commRowMedia}>
                    <img src='/image/shake.jpg' className={styles.imgPlaceholderComm}></img>
                  </div>
                  <div className={`${styles.commRowText} ${styles.commRowRight}`}>
                    <h3>Discover Our Collaborations</h3>
                    <p>Together, we work to enhance health services, promote wellness initiatives, and improve the overall well-being of our community. Discover how these collaborations bring innovative solutions and valuable resources to meet your health needs.</p>
                    <a href="#" className={`${styles.btn} ${styles.btnOutline}`}>Learn More</a>
                  </div>
                </div>

                {/* Row 2: text left, image right */}
                <div className={styles.commRow}>
                  <div className={styles.commRowText}>
                    <h3>Explore Our Initiatives</h3>
                    <p>From fitness and nutrition programs to mental health and chronic disease management, we offer a variety of services to help you lead a healthier, happier life.</p>
                    <a href="#" className={`${styles.btn} ${styles.btnOutline}`}>Learn More</a>
                  </div>
                  <div className={styles.commRowMedia}>
                    <img src='/image/childocjpg.jpg' className={styles.imgPlaceholderComm}></img>
                  </div>
                </div>

                {/* Row 3: image left, text right */}
                <div className={styles.commRow}>
                  <div className={styles.commRowMedia}>
                    <img src='image/R.jpg' className={styles.imgPlaceholderComm}></img>
                  </div>
                  <div className={`${styles.commRowText} ${styles.commRowRight}`}>
                    <h3>Community Support Center</h3>
                    <p>Our center offers information on health services, educational workshops, support groups, and more. Whether you need assistance navigating healthcare options or seeking wellness advice, our Community Support Center is here to help.</p>
                    <a href="#" className={`${styles.btn} ${styles.btnOutline}`}>Learn More</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL ── */}
        <div className={`${styles.container} ${styles.testiWrap}`}>
          <div className={styles.testi}>
            <div className={styles.testiMedia}>
              <img src='image/pic.webp' className={styles.imgPlaceholderTesti}></img>
            </div>
            <div>
              <span className={`${styles.badge} ${styles.testiBadge}`}>Our Testimonials</span>
              <p className={styles.testiQuote}>
                &ldquo;TeleHealth has been a lifesaver for me. The ability to consult with a doctor anytime, anywhere has made managing my health so much easier. The doctors are knowledgeable and compassionate, and I always feel heard and cared for.&rdquo;
              </p>
              <p className={styles.testiName}>John Dayne</p>
              <p className={styles.testiRole}>Contractor</p>
              <div className={styles.testiControls}>
                <div className={styles.testiBar} />
                <div className={styles.testiArrows}>
                  <button className={styles.arrowBtn} aria-label="Previous">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <button className={styles.arrowBtn} aria-label="Next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA + FOOTER ── */}
        <div className={styles.footerZone}>
          <div className={styles.container}>
            <div className={styles.cta}>
              <div className={styles.ctaText}>
                <h2>Master Your Wellness, Live Fully</h2>
                <p>By cultivating healthy habits and embracing balance, you&apos;ll unlock your full potential and enjoy a life of vitality and purpose.</p>
              </div>
              <Link href="/register" className={`${styles.btn} ${styles.btnLight}`}>
                Receive Your Quote
              </Link>
            </div>

            <div className={styles.footer}>
              <div className={styles.footerAbout}>
                <h3>Supporting Your Wellness Journey</h3>
                <p>Our comprehensive health resources, expert advice, and supportive community are here to guide you every step of the way.</p>
                <form className={styles.subscribe} action="#">
                  <input type="email" placeholder="Enter email address" aria-label="Email address" />
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: '10px 20px', fontSize: '13px' }}>
                    Subscribe
                  </button>
                </form>
              </div>

              <div className={styles.footerCol}>
                <h4>About TeleHealth</h4>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Our Team</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Contact Us</a></li>
                </ul>
              </div>

              <div className={styles.footerCol}>
                <h4>For Employees</h4>
                <ul>
                  <li><a href="#">Health Connect</a></li>
                  <li><a href="#">Employee Assistance Program</a></li>
                  <li><a href="#">Teammate Health Portal</a></li>
                  <li><a href="#">Employer Services</a></li>
                  <li><a href="#">Employee Assistance</a></li>
                </ul>
              </div>
            </div>

            <div className={styles.footerBottom}>
              <div className={styles.socials}>
                <a href="#" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 5.8c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.3 1.7-2.2-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.8 3.6A11.3 11.3 0 0 1 3.6 4.6a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.7-.5a4 4 0 0 0 3.2 3.9c-.5.2-1.1.2-1.7.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.3a11.3 11.3 0 0 0 6.1 1.8c7.4 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.1Z" />
                  </svg>
                </a>
                <a href="#" aria-label="Messenger">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.3 2 2 6.2 2 11.6c0 2.9 1.3 5.4 3.4 7.1V22l3.1-1.7c.8.2 1.7.3 2.5.3 5.7 0 10-4.2 10-9.6S17.7 2 12 2Zm1 12.5-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7Z" />
                  </svg>
                </a>
                <a href="#" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 9h3V6h-3c-2 0-3.5 1.5-3.5 3.5V11H8v3h2.5v7h3v-7H16l.5-3H13.5V9.5c0-.3.2-.5.5-.5Z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              </div>

              <Link className={`${styles.brand} ${styles.footerBrand}`} href="/">
                <span className={styles.brandMark}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 21s-7-4.35-9.5-8.5C.9 9.7 2.3 6 5.8 6c2 0 3.2 1.1 4.2 2.4C11 7.1 12.2 6 14.2 6c3.5 0 4.9 3.7 3.3 6.5C19 16.65 12 21 12 21Z" fill="#fff" />
                  </svg>
                </span>
                TeleHealth
              </Link>

              <span className={styles.footerTerms}>Terms &amp; Conditions</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
