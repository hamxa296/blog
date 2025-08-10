// Tour Test Script for GIKI Chronicles
class TourTest {
    constructor() {
        this.init();
    }

    init() {
        // Add test functions to window
        window.testTour = this.testTour.bind(this);
        window.resetTour = this.resetTour.bind(this);
        window.gotoStep = this.gotoStep.bind(this);
        
        console.log('Tour Test Functions Available:');
        console.log('- testTour(): Test all tour steps');
        console.log('- resetTour(): Reset tour state');
        console.log('- gotoStep(stepNumber): Go to specific step');
    }

    testTour() {
        console.log('🧪 Testing Tour Functionality...');
        
        if (!window.websiteTour) {
            console.error('❌ Tour not initialized');
            return;
        }

        console.log('✅ Tour initialized');
        console.log('📊 Current state:', {
            currentStep: window.websiteTour.currentStep,
            isActive: window.websiteTour.isActive,
            totalSteps: window.websiteTour.tourSteps.length
        });

        // Test element targeting for each step
        console.log('🎯 Testing element targeting:');
        window.websiteTour.tourSteps.forEach((step, index) => {
            if (step.target) {
                const element = window.websiteTour.findTargetElement(step.target);
                const status = element ? '✅ Found' : '❌ Not Found';
                console.log(`  Step ${index + 1} (${step.id}): ${status}`);
                if (element) {
                    console.log(`    Element:`, element.tagName, element.className);
                }
            } else {
                console.log(`  Step ${index + 1} (${step.id}): ✅ No target needed`);
            }
        });

        // Test localStorage
        console.log('💾 LocalStorage state:', {
            tourCompleted: localStorage.getItem('tour-completed'),
            welcomeShown: localStorage.getItem('welcome-popup-shown'),
            tourStarted: localStorage.getItem('tour-started')
        });
    }

    resetTour() {
        console.log('🔄 Resetting tour state...');
        localStorage.removeItem('tour-completed');
        localStorage.removeItem('welcome-popup-shown');
        localStorage.removeItem('tour-started');
        console.log('✅ Tour state reset');
        
        // Reload page to restart tour
        if (confirm('Tour state reset. Reload page to restart tour?')) {
            location.reload();
        }
    }

    gotoStep(stepNumber) {
        if (!window.websiteTour) {
            console.error('❌ Tour not initialized');
            return;
        }

        const stepIndex = stepNumber - 1;
        if (stepIndex < 0 || stepIndex >= window.websiteTour.tourSteps.length) {
            console.error(`❌ Invalid step number. Must be between 1 and ${window.websiteTour.tourSteps.length}`);
            return;
        }

        console.log(`🎯 Going to step ${stepNumber}...`);
        
        // Start tour if not active
        if (!window.websiteTour.isActive) {
            window.websiteTour.startTour();
        }
        
        // Set current step
        window.websiteTour.currentStep = stepIndex;
        window.websiteTour.showStep();
        
        console.log(`✅ Now on step ${stepNumber}: ${window.websiteTour.tourSteps[stepIndex].title}`);
    }
}

// Initialize test when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tourTest = new TourTest();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TourTest;
}
