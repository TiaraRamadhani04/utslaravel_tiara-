/**
 * PROFESSIONAL ANIMATIONS & TRANSITIONS
 * Smooth page transitions dengan Barba.js integration
 */

// ============================================
// SMOOTH ANIMATIONS HELPER
// ============================================

const AnimationManager = {
    // Fade in animation
    fadeIn: (element, duration = 500) => {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.offsetHeight; // Trigger reflow
            
            element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            setTimeout(resolve, duration);
        });
    },

    // Slide up animation
    slideUp: (element, duration = 500) => {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.offsetHeight;
            
            element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            setTimeout(resolve, duration);
        });
    },

    // Fade out animation
    fadeOut: (element, duration = 300) => {
        return new Promise(resolve => {
            element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px)';
            
            setTimeout(resolve, duration);
        });
    },

    // Pulse animation
    pulse: (element, duration = 1000) => {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
    },

    // Bounce animation
    bounce: (element, duration = 600) => {
        element.style.animation = `bounce ${duration}ms ease-in-out`;
    },

    // Glow effect
    glow: (element) => {
        element.style.animation = 'glow 2s ease-in-out infinite';
    }
};

// ============================================
// TABLE ANIMATIONS
// ============================================

const animateTableRows = async (tableBody) => {
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        row.style.transition = `all 0.3s ease-out ${index * 50}ms`;
        
        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 10);
    });
};

// ============================================
// STATS COUNTER ANIMATION
// ============================================

const animateCounter = (element, target, duration = 1000) => {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
};

// ============================================
// BUTTON RIPPLE EFFECT
// ============================================

const addRippleEffect = () => {
    const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-sm');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const radius = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - radius / 2;
            const y = e.clientY - rect.top - radius / 2;
            
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                width: ${radius * 2}px;
                height: ${radius * 2}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                left: ${x}px;
                top: ${y}px;
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
};

// Add ripple animation
if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// BARBA.JS INTEGRATION
// ============================================

const initBarba = () => {
    // Check if Barba is loaded
    if (typeof Barba === 'undefined') {
        console.warn('Barba.js not loaded. Using standard page navigation.');
        return;
    }

    // Barba container
    Barba.Pjax.getContainer = () => document.getElementById('barba-container');

    // Before transition
    Barba.Dispatcher.on('linkClicked', (e) => {
        const link = e.target.href;
        
        // Show loading indicator
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = '<div class="spinner"></div>';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            animation: fadeIn 0.3s ease-out;
        `;
        document.body.appendChild(loader);
    });

    // After transition
    Barba.Dispatcher.on('transitionCompleted', () => {
        // Remove loader
        const loader = document.querySelector('.page-loader');
        if (loader) loader.remove();
        
        // Re-initialize scripts
        initializeScripts();
    });

    // Start Barba
    Barba.Pjax.start();
};

// ============================================
// MODAL ANIMATIONS
// ============================================

const animateModalOpen = (modal) => {
    modal.classList.add('show');
    const content = modal.querySelector('.modal-content');
    
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(30px) scale(0.95)';
        content.offsetHeight;
        
        content.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0) scale(1)';
    }
};

const animateModalClose = (modal) => {
    const content = modal.querySelector('.modal-content');
    
    if (content) {
        content.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        content.style.opacity = '0';
        content.style.transform = 'translateY(30px) scale(0.95)';
        
        setTimeout(() => {
            modal.classList.remove('show');
        }, 300);
    } else {
        modal.classList.remove('show');
    }
};

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================

const initScrollReveal = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(30px)';
                entry.target.offsetHeight;
                
                entry.target.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section, .stat-card').forEach(el => {
        observer.observe(el);
    });
};

// ============================================
// PAGE INITIALIZATION
// ============================================

const initializeScripts = () => {
    // Add ripple effect to buttons
    addRippleEffect();
    
    // Initialize scroll reveal
    initScrollReveal();
    
    // Animate table rows when loaded
    const tableBody = document.querySelector('table tbody');
    if (tableBody) {
        animateTableRows(tableBody);
    }
    
    // Animate stat cards
    document.querySelectorAll('.stat-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 100}ms`;
    });
};

// ============================================
// SMOOTH SCROLLING
// ============================================

const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
};

// ============================================
// DOCUMENT READY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeScripts();
    initSmoothScroll();
});

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            animateModalClose(modal);
        });
    }
});

// ============================================
// PREVENT LAYOUT SHIFT
// ============================================

document.documentElement.style.scrollBehavior = 'smooth';

// Re-initialize on visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        initializeScripts();
    }
});
