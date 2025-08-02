import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import "./Time.css";
import ProfessionalSelector from "./ProfessionalsUpdated"; 
import { bookingsAPI, apiUtils, bookingFlow } from "../services/api"; 
import { useHeaderTitle } from '../Service/HeaderTitleContext'; 

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Time component now receives selectedService and selectedProfessional as props
const Time = ({ selectedService, selectedProfessional, onTimeSelect }) => { 
  const navigate = useNavigate();

  // Log props received by Time component
  console.log('Time Component Props: selectedService =', selectedService);
  console.log('Time Component Props: selectedProfessional =', selectedProfessional);

  const [selectedDate, setSelectedDate] = useState(() => {
    const savedBooking = bookingFlow.load();
    return savedBooking.selectedDate ? new Date(savedBooking.selectedDate) : new Date();
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(() => {
    const savedBooking = bookingFlow.load();
    if (savedBooking.selectedTimeSlot) {
        return { time: savedBooking.selectedTimeSlot, id: savedBooking.selectedTimeSlot }; 
    }
    return null;
  });
  const [showProfessionalPopup, setShowProfessionalPopup] = useState(false);

  // This state is primarily for the ProfessionalSelector popup.
  // We use it to initialize the popup with the current professional prop.
  const [professionalForPopup, setProfessionalForPopup] = useState(selectedProfessional);

  // Sync professionalForPopup with the prop when the prop changes (e.g., from Layout)
  useEffect(() => {
      console.log('Time: selectedProfessional prop changed, updating professionalForPopup:', selectedProfessional);
      setProfessionalForPopup(selectedProfessional);
  }, [selectedProfessional]);

  // --- State and Ref declarations ---
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false); 
  const [timeSlotsError, setTimeSlotsError] = useState(null);
  const popupRef = useRef(null); 
  const headingRef = useRef(null); 
  const [isMobile, setIsMobile] = useState(false); 
  const { setHeaderTitle } = useHeaderTitle();
  // --- End State and Ref declarations ---


  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const changeMonth = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
    setSelectedTime(null); 
  };

  const handleDateClick = (day) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
    setCalendarOpen(false);
    setSelectedTime(null); 
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() - selectedDate.getDay() + i); 
    return d;
  });

  // Effect to handle mobile detection for bottom bar visibility
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 600);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Effect to close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowProfessionalPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to update header title based on scroll
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setHeaderTitle('Select time');
        } else {
          setHeaderTitle('');
        }
      },
      { threshold: 0 }
    );
    if (headingRef.current) observer.observe(headingRef.current);
    return () => observer.disconnect();
  }, [setHeaderTitle]);

  // Effect to fetch available time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      setTimeSlotsError(null);
      setAvailableTimeSlots([]);
      setSelectedTime(null); 

      if (!selectedService || !selectedProfessional || selectedProfessional.id === 'any') {
        console.log('Time: Not fetching time slots. Missing service, professional, or "Any professional" selected.');
        setLoadingTimeSlots(false); 
        return; 
      }

      setLoadingTimeSlots(true);
      console.log('Time: Attempting to fetch time slots...');

      try {
        const formattedDate = apiUtils.formatDate(selectedDate);
        console.log("Time: Fetching time slots for:", {
          professionalId: selectedProfessional.id, 
          serviceId: selectedService._id,
          date: formattedDate
        });

        const response = await bookingsAPI.getAvailableTimeSlots(
          selectedProfessional.id, 
          selectedService._id,
          formattedDate
        );

        if (response.success && response.data?.timeSlots?.length > 0) {
          const transformedSlots = response.data.timeSlots
            .filter(slot => slot.available) 
            .map((slot, index) => ({
              id: `${selectedProfessional.id}-${selectedService._id}-${formattedDate}-${slot.startTime}`, 
              time: apiUtils.parseTimeSlot(slot), 
              startTime: slot.startTime, 
              endTime: slot.endTime,
              available: slot.available 
            }));
          setAvailableTimeSlots(transformedSlots);
          console.log('Time: Fetched time slots:', transformedSlots);
        } else {
          console.log("Time: API returned no available time slots for this professional and date.");
          setAvailableTimeSlots([]); 
        }
      } catch (err) {
        console.error('Time: Error fetching time slots:', err);
        setTimeSlotsError("Failed to load time slots. Please try again.");
        setAvailableTimeSlots([]);
      } finally {
        setLoadingTimeSlots(false);
      }
    };

    fetchTimeSlots();
  }, [selectedService, selectedProfessional, selectedDate]); 

  // Function to handle professional selection from the popup
  const handleProfessionalSelectInPopup = (professional) => {
    if (selectedService) { 
        bookingFlow.addProfessional(selectedService._id, professional); 
        bookingFlow.save(); 
        window.dispatchEvent(new CustomEvent('bookingFlowChange')); 
    }
    setShowProfessionalPopup(false);
    setSelectedTime(null); 
  };

  // Function to handle time slot selection
  const handleTimeSelect = (timeSlot) => {
    setSelectedTime(timeSlot);
    bookingFlow.saveDate(selectedDate.toISOString()); 
    bookingFlow.saveTime(timeSlot.time); 
    bookingFlow.save(); 

    if (onTimeSelect) { 
      onTimeSelect({
        date: selectedDate.toISOString(), 
        timeSlot: timeSlot, 
        professional: selectedProfessional, 
        service: selectedService 
      });
    }
  };

  // Logic for the "Continue" button action (common for desktop and mobile)
  const handleContinue = () => {
    if (!selectedTime) {
      alert("Please select an available time slot.");
      return;
    }
    navigate("/payment", { 
      state: {
        summaryData: bookingFlow.load() 
      }
    });
  };

  // Professional details for display in the header
  const professionalInitial = selectedProfessional?.name?.charAt(0)?.toUpperCase() || ''; 
  // FIX: Derive professionalName directly from selectedProfessional.user if available, otherwise fallback
  const professionalName = selectedProfessional?.id === 'any'
    ? 'Any professional'
    : (selectedProfessional?.user?.firstName && selectedProfessional?.user?.lastName
      ? `${selectedProfessional.user.firstName} ${selectedProfessional.user.lastName}`
      : selectedProfessional?.name || 'Select Professional'); // Fallback to 'name' or a generic if user object not present


  return (
    <div className="time-selector">
      <h1 ref={headingRef} className="header-title">Select time</h1>

      {/* Booking Context Section: Displays selected service and professional */}
      {(selectedService || selectedProfessional) && (
        <div className="booking-context-">
          {/* {selectedService && (
            <div className="context-item">
              <span className="context-label">Service:</span>
              <span className="context-value">{selectedService.name}</span>
            </div>
          )} */}
          {selectedProfessional && (
            <div className="context-item">
              {/* <span className="context-label">Professional:</span> */}
              <span className="context-value">
                {/* Use the already derived professionalName */}
                {/* {professionalName} */}
                {/* Only show subtitle/position for specific professionals, not "Any professional" */}
                {/* {selectedProfessional.id !== 'any' && (selectedProfessional.subtitle || selectedProfessional.position) && */}
                  {/* // <span> ({selectedProfessional.subtitle || selectedProfessional.position})</span>} */}
              </span>
            </div>
          )
          }
        </div>
      )}

      {/* Profile Section - Displays current professional and allows re-selection */}
      <div className="profile-section">
        <div className="profile-info" onClick={() => setShowProfessionalPopup(!showProfessionalPopup)}>
          <div className="avatar">
            <span>{professionalInitial || 'S'}</span> {/* Fallback 'S' for avatar if no initial */}
          </div>
          <span className="username">
            {professionalName || 'Select Professional'} {/* Fallback text if no professional name */}
          </span>
          <ChevronLeft className="dropdown-icon" />
        </div>

        {/* Calendar Picker - Full Month View Popup */}
        <div className="calendar-picker-wrapper">
          <button className="calendar-btn" onClick={() => setCalendarOpen(!calendarOpen)}>
            <Calendar className="calendar-icon" />
          </button>

          {calendarOpen && (
            <div className="calendar-popup">
              <div className="calendar-header">
                <button onClick={() => changeMonth(-1)} className="cal-arrow">
                  <ChevronLeft />
                </button>
                <span>
                  {selectedDate.toLocaleString("default", { month: "long" })} {selectedDate.getFullYear()}
                </span>
                <button onClick={() => changeMonth(1)} className="cal-arrow">
                  <ChevronRight />
                </button>
              </div>
              <div className="calendar-grid">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                  <div key={i} className="cal-day-name">{d}</div>
                ))}
                {Array(getFirstDayOfMonth(selectedDate.getFullYear(), selectedDate.getMonth()))
                  .fill("")
                  .map((_, i) => <div key={`empty-${i}`} className="cal-empty"></div>)}
                {Array(getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()))
                  .fill(0)
                  .map((_, i) => {
                    const day = i + 1;
                    const fullDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                    const isSelected = fullDate.toDateString() === selectedDate.toDateString();
                    const isToday = fullDate.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={day}
                        className={`cal-day ${isSelected ? "cal-day-selected" : ""} ${isToday ? "cal-day-today" : ""}`}
                        onClick={() => handleDateClick(day)}
                      >
                        {day}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popup for Professional Selection */}
      {showProfessionalPopup && (
        <div className="profile-popup">
          <div className="popup-content" ref={popupRef}>
            <div className="popup-header">
              {/* No H3 here now */}
              <button className="popup-close-btn" onClick={() => setShowProfessionalPopup(false)}>
                &times; 
              </button>
            </div>
            <div className="popup-scroll-view">
              {selectedService ? (
                <ProfessionalSelector 
                  selectedDate={selectedDate} 
                  selectedServices={[selectedService]} 
                  onProfessionalSelect={(allSelectedProfessionals) => { 
                    const selectedProForCurrentService = allSelectedProfessionals[selectedService._id];
                    if (selectedProForCurrentService) {
                       handleProfessionalSelectInPopup(selectedProForCurrentService);
                    } else {
                       handleProfessionalSelectInPopup({
                          id: "any",
                          name: "Any professional",
                          subtitle: "for maximum availability",
                          icon: "👥",
                          isAvailable: true,
                       });
                    }
                  }}
                />
              ) : (
                <div className="info-container">
                  <p>Please select a service first to choose a professional.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Month Navigation (Week View) */}
      <div className="month-navigation">
        <h2 className="month-title">
          {selectedDate.toLocaleString("default", { month: "long" })} {selectedDate.getFullYear()}
        </h2>
        <div className="nav-buttons">
          <button
            className="nav-btn"
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}
          >
            <ChevronLeft className="nav-icon" />
          </button>
          <button
            className="nav-btn"
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}
          >
            <ChevronRight className="nav-icon" />
          </button>
        </div>
      </div>

      {/* Date Grid (Week View) */}
      <div className="date-grid">
        {weekDates.map((date, index) => {
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const isToday = new Date().toDateString() === date.toDateString();
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date.getDate())} 
              className={`date-btn ${isSelected ? "date-btn-selected" : ""} ${isToday ? "date-btn-today" : ""}`}
            >
              <span className="date-number">{date.getDate()}</span>
              <span className="date-day">
                {date.toLocaleString("default", { weekday: "short" })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time Slots Display Area */}
      <div className="time-slots-wrapper">
        {loadingTimeSlots ? (
          <div className="time-slots-grid">
            {Array.from({ length: 8 }).map((_, i) => ( 
              <Skeleton key={i} className="time-slot-skeleton" height={50} width="100%" />
            ))}
          </div>
        ) : timeSlotsError ? (
          <div className="info-container error-state">
            <p className="error-message">Error loading time slots: {timeSlotsError}</p>
            <button onClick={() => window.location.reload()} className="retry-button">Try Again</button>
          </div>
        ) : !selectedService ? ( 
          <div className="info-container">
            <p>Please select a service first.</p>
          </div>
        ) : !selectedProfessional || selectedProfessional.id === 'any' ? ( 
          <div className="info-container">
            <p>Please select a specific professional to see available times for booking.</p>
          </div>
        ) : availableTimeSlots.length === 0 ? ( 
          <div className="info-container">
            <p>No available time slots for **{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**.</p>
            <p>Please choose a different date.</p>
          </div>
        ) : ( 
          <div className="time-slots-grid">
            {availableTimeSlots.map((timeSlot) => (
              <button
                key={timeSlot.id}
                onClick={() => handleTimeSelect(timeSlot)}
                className={`time-slot ${selectedTime?.id === timeSlot.id ? "time-slot-selected" : ""} ${!timeSlot.available ? "time-slot-disabled" : ""}`}
                disabled={!timeSlot.available}
              >
                <span className="time-text">{timeSlot.time}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ServiceBottomBar
        currentStep={3} 
        navigate={navigate}
        canContinue={!!selectedTime} 
        onContinue={handleContinue} 
      />
    </div>
  );
};

// ServiceBottomBar component
function ServiceBottomBar({ currentStep, navigate, canContinue, onContinue }) {
  const [selectedServices, setSelectedServices] = useState([]); 

  useEffect(() => {
    const loadServices = () => {
      bookingFlow.load();
      setSelectedServices(bookingFlow.selectedServices || []);
    };
    
    loadServices();

    const handler = () => {
      loadServices();
    };
    window.addEventListener("bookingFlowChange", handler);
    return () => window.removeEventListener("bookingFlowChange", handler);
  }, []);

  const totalDuration = selectedServices.reduce(
    (sum, svc) => sum + (svc.duration || 0),
    0
  );
  const totalRate = selectedServices.reduce(
    (sum, svc) => sum + (svc.price || 0),
    0
  );

  return (
    <div className="service-bottom-bar">
      <span>{totalDuration} min</span>
      <span>{selectedServices.length} services</span>
      <span>AED {totalRate}</span>
      <button
        className={`btn-continue ${!canContinue ? "disabled" : ""}`}
        onClick={onContinue}
        disabled={!canContinue}
      >
        {currentStep === 4 ? "Complete Booking" : "Continue"}
      </button>
    </div>
  );
}

export default Time;