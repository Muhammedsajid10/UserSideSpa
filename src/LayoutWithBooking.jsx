import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { bookingFlow, apiUtils } from './services/api';
import './Layout.css'; // Assuming this CSS file exists
import { HeaderTitleProvider, useHeaderTitle } from './Service/HeaderTitleContext'; // Assuming this context exists
import { useAuth } from './Service/Context'; // Assuming this context exists
import alloraLogo from './assets/allora-logo-header.svg'; // Assuming logo asset exists
import Swal from 'sweetalert2'; // Assuming SweetAlert2 is installed

// ProfileIcon component - No changes
const ProfileIcon = () => (
  <svg className="profile-avatar" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#e0e0e0" />
    <ellipse cx="20" cy="16" rx="7" ry="7" fill="#bdbdbd" />
    <ellipse cx="20" cy="30" rx="12" ry="7" fill="#bdbdbd" />
  </svg>
);

// GlobalHeader component - No changes
const GlobalHeader = () => {
  const { headerTitle } = useHeaderTitle();
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.user-profile-dropdown')) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  return (
    <div className="global-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" className="logo-link" style={{ textDecoration: 'none' }}>
          <img 
            src={alloraLogo} 
            alt="Allora Spa" 
            className="header-logo"
            style={{ 
              height: '36px', 
              width: 'auto',
              maxWidth: '140px',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        </Link>
        {headerTitle && <span className="header-title">{headerTitle}</span>}
      </div>
      {isAuthenticated && user && (
        <div className={`user-profile-dropdown${dropdownOpen ? ' open' : ''}`}>
          <div
            className="profile-trigger"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            <span>{user.firstName}</span>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="profile-avatar"
              />
            ) : (
              <ProfileIcon />
            )}
          </div>
          <div className="dropdown-content">
            <Link to="/client-profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
            
            <button onClick={() => { logout(); setDropdownOpen(false); }}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
};

const LayoutWithBooking = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null); // Managed here
  const [selectedProfessional, setSelectedProfessional] = useState(null); // Managed here
  const [summaryKey, setSummaryKey] = useState(0); // To force re-render of summary

  // Define the booking flow steps
  const steps = [
    { number: 1, label: 'Service', path: '/' },
    { number: 2, label: 'Professional', path: '/professionals' },
    { number: 3, label: 'Time', path: '/time' },
    { number: 4, label: 'Payment', path: '/payment' }
  ];

  // Determine current step based on location
  useEffect(() => {
    const currentPath = location.pathname;
    const stepIndex = steps.findIndex(step => step.path === currentPath);
    setCurrentStep(stepIndex >= 0 ? stepIndex + 1 : 1);
  }, [location.pathname, steps]); // Add steps to dependency array for completeness

  // Load selected booking data from booking flow and update local states
  useEffect(() => {
    const loadBookingData = () => {
      console.log('Loading booking data...');
      bookingFlow.load(); // Load data into bookingFlow object
      console.log('Booking flow data:', bookingFlow);

      // Update selectedService state
      if (bookingFlow.selectedServices && bookingFlow.selectedServices.length > 0) {
        setSelectedService(bookingFlow.selectedServices[0]);
      } else {
        setSelectedService(null);
      }

      // Update selectedProfessional state from bookingFlow for the *first* service
      if (bookingFlow.selectedServices && bookingFlow.selectedServices.length > 0) {
        const firstServiceId = bookingFlow.selectedServices[0]._id;
        if (bookingFlow.selectedProfessionals && bookingFlow.selectedProfessionals[firstServiceId]) {
          setSelectedProfessional(bookingFlow.selectedProfessionals[firstServiceId]);
        } else {
          // If no specific professional is chosen for the current service, default to "Any professional"
          // This ensures `selectedProfessional` is never null if services are selected.
          setSelectedProfessional({
            id: "any",
            name: "Any professional",
            subtitle: "for maximum availability",
            icon: "👥",
            isAvailable: true,
          });
        }
      } else {
        setSelectedProfessional(null); // No service selected, so no professional context
      }

      // Force re-render of the booking summary to reflect latest changes
      setSummaryKey(k => k + 1);
    };
    
    // Initial load
    loadBookingData();
    
    // Event listeners for booking flow changes
    const handleStorageChange = () => {
      console.log('Storage changed, reloading booking data...');
      loadBookingData();
    };
    
    const handleBookingFlowChange = () => {
      console.log('Booking flow change event received, reloading data...');
      loadBookingData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bookingFlowChange', handleBookingFlowChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookingFlowChange', handleBookingFlowChange);
    };
  }, []); 

  const handleContinue = () => {
    // Before navigating, check if canContinue logic allows
    if (!canContinue()) {
        // canContinue() already handles the alert/Swal messages.
        // This outer check prevents navigation if the inner conditions are not met.
        return; 
    }

    switch (currentStep) {
      case 1: // Service selection
        navigate('/professionals');
        break;
      case 2: // Professional selection
        // The selectedProfessional state in Layout is already updated via useEffect
        // based on bookingFlow. No need to explicitly set state here again.
        navigate('/time');
        break;
      case 3: // Time selection
        navigate('/payment');
        break;
      case 4: // Payment
        Swal.fire({
          title: 'Payment Step',
          text: 'Payment step - implement payment logic',
          icon: 'info',
          confirmButtonText: 'OK',
          timer: 3000,
          showConfirmButton: true
        });
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 1: 
        navigate('/'); // Go to home if this is the first step
        break;
      case 2: // Professional selection
        navigate('/');
        break;
      case 3: // Time selection
        navigate('/professionals');
        break;
      case 4: // Payment
        navigate('/time');
        break;
      default:
        break;
    }
  };

  const canContinue = () => {
    // Always load the latest state from bookingFlow before checking
    bookingFlow.load(); 

    switch (currentStep) {
      case 1: // Service selection
        if (!bookingFlow.selectedServices || bookingFlow.selectedServices.length === 0) {
          Swal.fire({
            title: 'Service Required',
            text: 'Please select at least one service first.',
            icon: 'warning',
            confirmButtonText: 'OK',
            timer: 3000,
            showConfirmButton: true
          });
          return false;
        }
        return true;
      case 2: // Professional selection
        if (!bookingFlow.selectedServices || bookingFlow.selectedServices.length === 0) {
          Swal.fire({
            title: 'Service Required',
            text: 'Please select a service first.', // Should ideally not be reached if previous step is enforced
            icon: 'warning',
            confirmButtonText: 'OK',
            timer: 3000,
            showConfirmButton: true
          });
          return false;
        }
        // Check if a professional is selected for the *first* service
        const firstServiceId = bookingFlow.selectedServices[0]?._id;
        if (!firstServiceId || !bookingFlow.selectedProfessionals || !bookingFlow.selectedProfessionals[firstServiceId]) {
          Swal.fire({
            title: 'Professional Required',
            text: 'Please select a professional for your service.',
            icon: 'warning',
            confirmButtonText: 'OK',
            timer: 3000,
            showConfirmButton: true
          });
          return false;
        }
        return true;
      case 3: // Time selection
        if (!bookingFlow.selectedTimeSlot) {
          Swal.fire({
            title: 'Time Slot Required',
            text: 'Please select an available time slot.',
            icon: 'warning',
            confirmButtonText: 'OK',
            timer: 3000,
            showConfirmButton: true
          });
          return false;
        }
        return true;
      case 4: // Payment - always allow
        return true; 
      default:
        return false;
    }
  };

  // getStepTitle remains unchanged
  const getStepTitle = () => {
    return steps[currentStep - 1]?.label || 'Booking';
  };

  return (
    <HeaderTitleProvider>
      <>
        <GlobalHeader />
        <div className="layout-with-booking">
          <div className="main-content">
            <div className="page-header" /> 
            {/* This is where you render your main content components (Services, Professionals, Time, Payment)
              based on `location.pathname`. You should use React Router's <Routes> and <Route> here.
              For example:
              <Routes>
                  <Route path="/" element={<Services />} />
                  <Route path="/professionals" element={<ProfessionalsUpdated />} />
                  <Route path="/time" element={<Time selectedService={selectedService} selectedProfessional={selectedProfessional} />} />
                  <Route path="/payment" element={<Payment />} />
              </Routes>
              
              The `children` prop approach you have can work if you're passing a single child
              that changes with routing, but directly using <Routes> is more explicit and common.
              
              For the current `children` pattern, `React.cloneElement` is used to pass props.
              It's important that the components rendered as `children` are the actual components
              like <Time /> in your <App /> or parent routing setup.
            */}
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                // Check child component name to pass specific props
                // Ensure the component names match your imports/exports (e.g., 'Time' or 'SelectProfessional')
                if (child.type && child.type.name === 'Time') {
                    return React.cloneElement(child, {
                        selectedService: selectedService, // Pass the service from Layout's state
                        selectedProfessional: selectedProfessional, // Pass the professional from Layout's state
                        // onTimeSelect callback is handled by Time internally updating bookingFlow
                    });
                }
                if (child.type && child.type.name === 'SelectProfessional') { // Assuming your ProfessionalsUpdated is named SelectProfessional
                    return React.cloneElement(child, {
                         selectedDate: bookingFlow.load().selectedDate ? new Date(bookingFlow.load().selectedDate) : new Date(),
                         selectedServices: bookingFlow.selectedServices || [],
                         // onProfessionalSelect is handled internally by SelectProfessional updating bookingFlow
                    });
                }
              }
              return child; // Render other children as-is (e.g., Services or Payment)
            })}
          </div>
          <div className="booking-sidebar">
            <div className="booking-summary" key={summaryKey}>
              <h3>Booking Summary</h3>
              {bookingFlow.selectedServices && bookingFlow.selectedServices.length > 0 ? (
                <div className="selected-services-scroll">
                  <div className="selected-services">
                    {bookingFlow.selectedServices.map((service) => ( // Removed index as it's not used
                      <div key={service._id} className="selected-service">
                        <div className="service-header">
                          <h4>{service.name}</h4>
                          <button 
                            className="remove-service-btn"
                            onClick={() => {
                              bookingFlow.removeService(service._id);
                              window.dispatchEvent(new CustomEvent('bookingFlowChange'));
                              // Optionally, if removing a service invalidates professional/time, reset them here
                            }}
                            title="Remove service"
                          >
                            ×
                          </button>
                        </div>
                        <div className="service-details">
                          <div className="detail-item">
                            <span className="label">Duration:</span>
                            <span className="value">{apiUtils.formatDuration(service.duration)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Price:</span>
                            <span className="value">{apiUtils.formatPrice(service.price)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Category:</span>
                            <span className="value">
                              {typeof service.category === 'object' 
                                ? (service.category.displayName || service.category.name || 'N/A')
                                : service.category
                              }
                            </span>
                          </div>
                          {/* Display selected professional here */}
                          {bookingFlow.selectedProfessionals && bookingFlow.selectedProfessionals[service._id] && (
                            <div className="detail-item">
                              <span className="label">Professional:</span>
                              <span className="value">
                                {bookingFlow.selectedProfessionals[service._id].name}
                                {/* Show position/subtitle only if it's a specific professional, not "Any professional" */}
                                {bookingFlow.selectedProfessionals[service._id].id !== 'any' &&
                                 (bookingFlow.selectedProfessionals[service._id].subtitle || bookingFlow.selectedProfessionals[service._id].position) && (
                                    <span> ({bookingFlow.selectedProfessionals[service._id].subtitle || bookingFlow.selectedProfessionals[service._id].position})</span>
                                )}
                              </span>
                            </div>
                          )}
                           {/* Display selected date and time */}
                          {bookingFlow.selectedDate && bookingFlow.selectedTimeSlot && (
                            <div className="detail-item">
                              <span className="label">Date & Time:</span>
                              <span className="value">
                                {new Date(bookingFlow.selectedDate).toLocaleDateString()} at {bookingFlow.selectedTimeSlot}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-services">
                  <p>No services selected yet.</p>
                  <p>Choose services to start your booking.</p>
                </div>
              )}
              <div className="sidebar-bottom-fixed">
                <div className="total-summary">
                  <div className="detail-item">
                    <span className="label">Total Duration:</span>
                    <span className="value">{apiUtils.formatDuration(bookingFlow.getTotalDuration())}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Price:</span>
                    <span className="value">{apiUtils.formatPrice(bookingFlow.getTotalPrice())}</span>
                  </div>
                </div>
                <div className="progress-steps">
                  {steps.map((step) => (
                    <div 
                      key={step.number} 
                      className={`step ${step.number === currentStep ? 'active' : ''}`}
                    >
                      <div className="step-number">{step.number}</div>
                      <div className="step-label">{step.label}</div>
                    </div>
                  ))}
                </div>
                <div className="action-buttons">
                  <button 
                    className="btn-back" 
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    Back
                  </button>
                  <button 
                    className={`btn-continue ${!canContinue() ? 'disabled' : ''}`}
                    onClick={handleContinue}
                    disabled={!canContinue()}
                  >
                    {currentStep === steps.length ? 'Complete Booking' : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </HeaderTitleProvider>
  );
};

export default LayoutWithBooking;