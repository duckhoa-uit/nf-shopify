/**
 * Size Fit Modal JavaScript
 * Handles modal functionality, unit conversion, and size recommendations
 */

class SizeFitModal {
  constructor(modalId) {
    this.modalId = modalId;
    this.modal = document.getElementById(modalId);
    this.currentUnit = 'cm';
    this.productData = null;
    
    if (this.modal) {
      this.init();
    }
  }

  init() {
    this.bindEvents();
    this.initTabs();
    this.initUnitConverter();
    this.initSizeRecommender();
  }

  bindEvents() {
    // Modal open/close
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-size-fit-modal]')) {
        e.preventDefault();
        this.openModal();
      }
      
      if (e.target.matches('[data-modal-close]') || e.target.closest('[data-modal-close]')) {
        this.closeModal();
      }
    });

    // Close on backdrop click
    this.modal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      this.closeModal();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });
  }

  initTabs() {
    const tabButtons = this.modal.querySelectorAll('.tab-btn');
    const tabPanels = this.modal.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab panel
        tabPanels.forEach(panel => {
          panel.classList.add('hidden');
          panel.classList.remove('active');
        });
        
        const targetPanel = this.modal.querySelector(`#${targetTab}`);
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
          targetPanel.classList.add('active');
        }
      });
    });
  }

  initUnitConverter() {
    const unitButtons = this.modal.querySelectorAll('.unit-btn');
    
    unitButtons.forEach(button => {
      button.addEventListener('click', () => {
        const unit = button.dataset.unit;
        this.switchUnit(unit);
        
        // Update active button
        unitButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }

  switchUnit(unit) {
    if (this.currentUnit === unit) return;
    
    this.currentUnit = unit;
    const measurementValues = this.modal.querySelectorAll('.measurement-value');
    const unitLabels = this.modal.querySelectorAll('.unit-label');
    
    measurementValues.forEach(element => {
      const cmValue = element.dataset.cm;
      const inValue = element.dataset.in;
      
      if (unit === 'cm' && cmValue) {
        element.textContent = cmValue;
      } else if (unit === 'in' && inValue) {
        element.textContent = inValue;
      }
    });

    // Update unit labels
    unitLabels.forEach(label => {
      label.textContent = unit === 'cm' ? '(cm)' : '(in)';
    });

    // Update form placeholders in size recommender
    this.updateRecommenderUnits(unit);
  }

  updateRecommenderUnits(unit) {
    const form = this.modal.querySelector('#size-recommender-form');
    if (!form) return;

    const inputs = {
      chest: form.querySelector('#chest-input'),
      waist: form.querySelector('#waist-input'),
      height: form.querySelector('#height-input'),
      weight: form.querySelector('#weight-input')
    };

    if (unit === 'cm') {
      inputs.chest && (inputs.chest.placeholder = '86-140');
      inputs.waist && (inputs.waist.placeholder = '60-140');
      inputs.height && (inputs.height.placeholder = '150-210');
      inputs.weight && (inputs.weight.placeholder = '40-150');
    } else {
      inputs.chest && (inputs.chest.placeholder = '34-55');
      inputs.waist && (inputs.waist.placeholder = '24-55');
      inputs.height && (inputs.height.placeholder = '59-83');
      inputs.weight && (inputs.weight.placeholder = '88-330');
    }
  }

  initSizeRecommender() {
    const form = this.modal.querySelector('#size-recommender-form');
    if (!form) return;

    // Handle fit preference selection
    const fitOptions = form.querySelectorAll('.fit-preference-option');
    fitOptions.forEach(option => {
      option.addEventListener('click', () => {
        fitOptions.forEach(opt => {
          const div = opt.querySelector('div');
          div.classList.remove('border-red-500', 'bg-red-50');
          div.classList.add('border-gray-200');
        });
        
        const selectedDiv = option.querySelector('div');
        selectedDiv.classList.remove('border-gray-200');
        selectedDiv.classList.add('border-red-500', 'bg-red-50');
        
        option.querySelector('input').checked = true;
      });
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculateSizeRecommendation(form);
    });
  }

  async calculateSizeRecommendation(form) {
    const formData = new FormData(form);
    const measurements = {
      chest: parseFloat(formData.get('chest')),
      waist: parseFloat(formData.get('waist')),
      height: parseFloat(formData.get('height')) || null,
      weight: parseFloat(formData.get('weight')) || null,
      fit_preference: formData.get('fit_preference') || 'regular'
    };

    // Convert to cm if needed
    if (this.currentUnit === 'in') {
      measurements.chest = measurements.chest * 2.54;
      measurements.waist = measurements.waist * 2.54;
      if (measurements.height) measurements.height = measurements.height * 2.54;
      if (measurements.weight) measurements.weight = measurements.weight * 0.453592; // lb to kg
    }

    this.showLoading();
    
    try {
      const recommendation = await this.getSizeRecommendation(measurements);
      this.showRecommendation(recommendation);
    } catch (error) {
      this.showError(error.message);
    }
  }

  async getSizeRecommendation(measurements) {
    // Simulate API call - replace with actual implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const recommendation = this.calculateBasicRecommendation(measurements);
          resolve(recommendation);
        } catch (error) {
          reject(error);
        }
      }, 1500);
    });
  }

  calculateBasicRecommendation(measurements) {
    // Basic size recommendation algorithm
    const { chest, waist, fit_preference } = measurements;
    
    if (!chest || !waist) {
      throw new Error('Chest and waist measurements are required');
    }

    // Sample size chart (should come from product metafields)
    const sizeChart = {
      'XS': { chest: { min: 82, max: 86 }, waist: { min: 68, max: 72 } },
      'S': { chest: { min: 86, max: 94 }, waist: { min: 72, max: 80 } },
      'M': { chest: { min: 94, max: 102 }, waist: { min: 80, max: 88 } },
      'L': { chest: { min: 102, max: 110 }, waist: { min: 88, max: 96 } },
      'XL': { chest: { min: 110, max: 118 }, waist: { min: 96, max: 104 } }
    };

    let bestMatch = null;
    let bestScore = -1;
    const results = [];

    Object.entries(sizeChart).forEach(([size, ranges]) => {
      const chestFit = this.calculateFitScore(chest, ranges.chest);
      const waistFit = this.calculateFitScore(waist, ranges.waist);
      const totalScore = (chestFit * 0.6) + (waistFit * 0.4); // Weighted score
      
      results.push({
        size,
        score: totalScore,
        confidence: Math.min(95, Math.max(60, totalScore))
      });

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = { size, confidence: Math.min(95, Math.max(60, totalScore)) };
      }
    });

    // Apply fit preference adjustment
    if (fit_preference === 'tight' && bestMatch) {
      const sizes = ['XS', 'S', 'M', 'L', 'XL'];
      const currentIndex = sizes.indexOf(bestMatch.size);
      if (currentIndex > 0) {
        bestMatch.size = sizes[currentIndex - 1];
        bestMatch.confidence = Math.max(70, bestMatch.confidence - 10);
      }
    } else if (fit_preference === 'loose' && bestMatch) {
      const sizes = ['XS', 'S', 'M', 'L', 'XL'];
      const currentIndex = sizes.indexOf(bestMatch.size);
      if (currentIndex < sizes.length - 1) {
        bestMatch.size = sizes[currentIndex + 1];
        bestMatch.confidence = Math.max(70, bestMatch.confidence - 10);
      }
    }

    // Get alternative sizes
    const alternatives = results
      .filter(r => r.size !== bestMatch.size && r.score > 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    return {
      recommendedSize: bestMatch.size,
      confidence: bestMatch.confidence,
      explanation: this.getExplanation(bestMatch, fit_preference),
      alternatives: alternatives.map(alt => alt.size)
    };
  }

  calculateFitScore(measurement, range) {
    const mid = (range.min + range.max) / 2;
    const tolerance = (range.max - range.min) / 2;
    
    if (measurement >= range.min && measurement <= range.max) {
      return 100; // Perfect fit
    }
    
    const distance = Math.min(
      Math.abs(measurement - range.min),
      Math.abs(measurement - range.max)
    );
    
    return Math.max(0, 100 - (distance / tolerance) * 50);
  }

  getExplanation(recommendation, fitPreference) {
    const fitText = {
      'tight': 'snug fit',
      'regular': 'comfortable fit',
      'loose': 'relaxed fit'
    };

    return `Based on your measurements and preference for ${fitText[fitPreference]}, size ${recommendation.size} should provide the best fit.`;
  }

  showLoading() {
    this.hideAllStates();
    this.modal.querySelector('#recommender-loading').classList.remove('hidden');
  }

  showRecommendation(recommendation) {
    this.hideAllStates();
    
    const resultsDiv = this.modal.querySelector('#recommendation-results');
    const sizeElement = resultsDiv.querySelector('#recommended-size');
    const confidenceElement = resultsDiv.querySelector('#confidence-score');
    const explanationElement = resultsDiv.querySelector('#recommendation-explanation');
    const alternativesDiv = resultsDiv.querySelector('#alternative-sizes');
    const alternativesList = resultsDiv.querySelector('#alternative-sizes-list');

    sizeElement.textContent = recommendation.recommendedSize;
    confidenceElement.textContent = `${recommendation.confidence}% confidence`;
    explanationElement.textContent = recommendation.explanation;

    if (recommendation.alternatives && recommendation.alternatives.length > 0) {
      alternativesList.innerHTML = recommendation.alternatives
        .map(size => `<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">${size}</span>`)
        .join('');
      alternativesDiv.classList.remove('hidden');
    } else {
      alternativesDiv.classList.add('hidden');
    }

    resultsDiv.classList.remove('hidden');
  }

  showError(message) {
    this.hideAllStates();
    
    const errorDiv = this.modal.querySelector('#recommendation-error');
    const messageElement = errorDiv.querySelector('#error-message');
    
    messageElement.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  hideAllStates() {
    const states = ['#recommender-loading', '#recommendation-results', '#recommendation-error'];
    states.forEach(selector => {
      const element = this.modal.querySelector(selector);
      if (element) element.classList.add('hidden');
    });
  }

  openModal() {
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus trap
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  closeModal() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = '';
    this.hideAllStates();
    
    // Reset form
    const form = this.modal.querySelector('#size-recommender-form');
    if (form) form.reset();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SizeFitModal('size-fit-modal');
});
