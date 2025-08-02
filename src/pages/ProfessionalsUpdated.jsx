import React, { useState, useEffect, useRef } from "react";
import "./ProfessionalSelection.css"; // This CSS file for SelectProfessional
import { FaStar } from "react-icons/fa";
import { bookingsAPI, apiUtils, bookingFlow } from "../services/api";
import { useNavigate } from "react-router-dom";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const SelectProfessional = () => {
  const [professionals, setProfessionals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [currentStep] = useState(2); // Step 2 for professional selection
  const previousServicesRef = useRef([]);

  const navigate = useNavigate();

  // Load selected services from booking flow
  useEffect(() => {
    const loadSelectedServices = () => {
      const savedData = bookingFlow.load();
      const newServices = savedData.selectedServices || [];
      setSelectedServices(newServices);
      previousServicesRef.current = newServices;
    };

    loadSelectedServices();

    const handleBookingFlowChange = () => {
      const currentServices = bookingFlow.selectedServices || [];
      const servicesChanged = JSON.stringify(currentServices) !== JSON.stringify(previousServicesRef.current);
      
      if (servicesChanged) {
        console.log('Services changed, reloading professionals...');
        setSelectedServices(currentServices);
        previousServicesRef.current = currentServices;
      }
    };

    window.addEventListener("bookingFlowChange", handleBookingFlowChange);

    return () => {
      window.removeEventListener("bookingFlowChange", handleBookingFlowChange);
    };
  }, []);

  // Fetch available professionals when services are available
  useEffect(() => {
    const fetchProfessionals = async () => {
      if (!selectedServices.length) {
        setProfessionals([]);
        return;
      }

      setLoading(true);
      setError(null);

      const anyProfessionalOption = {
        id: "any",
        name: "Any professional",
        subtitle: "for maximum availability",
        icon: "👥",
        isAvailable: true,
      };

      try {
        const data = bookingFlow.load();
        const selectedDate = data.selectedDate
          ? new Date(data.selectedDate)
          : new Date();
        const formattedDate = apiUtils.formatDate(selectedDate);

        const firstService = selectedServices[0];
        console.log(
          "Fetching professionals for service:",
          firstService._id,
          "date:",
          formattedDate
        );

        const response = await bookingsAPI.getAvailableProfessionals(
          firstService._id,
          formattedDate
        );

        console.log("API response:", response);

        if (response.success && response.data?.professionals?.length > 0) {
          const transformedProfessionals = response.data.professionals.map(
            (employee) => ({
              id: employee._id,
              name: `${employee.user.firstName} ${employee.user.lastName}`,
              subtitle: employee.position,
              letter: employee.user.firstName.charAt(0),
              rating: employee.performance?.ratings?.average || 0,
              employeeId: employee.employeeId,
              specializations: employee.specializations || [],
              image: null,
              isAvailable: true,
              employee: employee,
            })
          );
          setProfessionals([anyProfessionalOption, ...transformedProfessionals]);
        } else {
          console.log("No specific professionals found for the selected criteria, displaying 'Any professional' option.");
          setProfessionals([anyProfessionalOption]); 
        }
      } catch (err) {
        console.error("Error fetching professionals:", err);
        setError("Failed to load professionals. Please try again.");
        setProfessionals([anyProfessionalOption]); 
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [selectedServices]);

  const handleProfessionalSelect = (professional) => {
    setSelectedId(professional.id);

    if (professional.id !== "any") {
      if (professional.id.startsWith("sample")) { // Keep this if you still have sample IDs from any source
        const professionalData = {
          id: professional.id,
          _id: professional.id,
          name: professional.name,
          user: professional.employee.user,
          position: professional.employee.position,
          employeeId: professional.employee.employeeId,
        };
        bookingFlow.selectedServices.forEach((service) => {
          bookingFlow.addProfessional(service._id, professionalData);
        });
      } else {
        bookingFlow.selectedServices.forEach((service) => {
          bookingFlow.addProfessional(service._id, professional.employee);
        });
      }
    } else {
      const anyProfessional = { id: "any", name: "Any professional" };
      bookingFlow.selectedServices.forEach((service) => {
        bookingFlow.addProfessional(service._id, anyProfessional);
      });
    }

    console.log("Professional selected:", professional);
    console.log(
      "Updated bookingFlow.selectedProfessionals:",
      bookingFlow.selectedProfessionals
    );
  };

  // --- Render based on state: Loading, Error, No Services, or Content ---

  if (loading) {
    const numberOfSkeletons = 6; 
    return (
      <div className="select-professional-container">
        <h2>Select professional</h2>
        <div className="professional-grid">
          {Array.from({ length: numberOfSkeletons }).map((_, index) => (
            <div key={index} className="professional-card skeleton-card">
              <Skeleton circle={true} height={60} width={60} style={{ marginBottom: '10px' }} />
              <Skeleton width="80%" height={16} style={{ marginBottom: '8px' }} />
              <Skeleton width="60%" height={14} style={{ marginBottom: '15px' }} />
              <Skeleton width={40} height={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="select-professional-container">
        <h2>Select professional</h2>
        <div className="info-container error-state">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  if (!selectedServices.length) {
    return (
      <div className="select-professional-container">
        <h2>Select professional</h2>
        <div className="info-container">
          <p>Please select services first to see available professionals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="select-professional-container">
      <h2>Select professional</h2>

      <div className="professional-grid">
        {professionals.map((pro) => (
          <div
            key={pro.id}
            className={`professional-card ${
              selectedId === pro.id ? "selected" : ""
            }`}
            onClick={() => handleProfessionalSelect(pro)}
          >
            {pro.icon && <div className="icon-circle">{pro.icon}</div>}
            {pro.image && (
              <div className="image-circle">
                <img src={pro.image} alt={pro.name} />
                {pro.rating && (
                  <div className="rating-badge">
                    {pro.rating} <FaStar className="star" />
                  </div>
                )}
              </div>
            )}
            {!pro.icon && !pro.image && pro.letter && <div className="letter-circle">{pro.letter}</div>}
            
            <div className="name-text">{pro.name}</div>
            {pro.subtitle && (
              <div className="subtitle-text">{pro.subtitle}</div>
            )}

            {pro.rating > 0 && (
              <div className="rating-display">
                <FaStar className="star" />
                <span>{pro.rating}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Render ServiceBottomBar ONCE. Its visibility is controlled by CSS media queries. */}
      {selectedServices.length > 0 && (
        <ServiceBottomBar currentStep={currentStep} navigate={navigate} />
      )}
    </div>
  );
};

// ServiceBottomBar component
function ServiceBottomBar({ currentStep = 2, navigate }) {
  const [selectedServices, setSelectedServices] = React.useState([]);

  React.useEffect(() => {
    bookingFlow.load();
    setSelectedServices(bookingFlow.selectedServices || []);
    const handler = () => {
      bookingFlow.load();
      setSelectedServices(bookingFlow.selectedServices || []);
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

  const canContinue = () => {
    // This canContinue logic should match the one in LayoutWithBooking.jsx for step 2
    bookingFlow.load(); // Ensure latest data
    if (!bookingFlow.selectedServices || bookingFlow.selectedServices.length === 0) {
        return false;
    }
    // Check if a professional is selected for the *first* service
    const firstServiceId = bookingFlow.selectedServices[0]?._id;
    return !!(firstServiceId && bookingFlow.selectedProfessionals && bookingFlow.selectedProfessionals[firstServiceId]);
  };

  const handleContinue = () => {
    if (canContinue()) {
        navigate("/time");
    } else {
        alert("Please select a professional."); // Using alert here, consider Swal if appropriate
    }
  };

  return (
    <div className="service-bottom-bar">
      <span>{totalDuration} min</span>
      <span>{selectedServices.length} services</span>
      <span>AED {totalRate}</span>
      <button
        className={`btn-continue ${!canContinue() ? "disabled" : ""}`}
        onClick={handleContinue}
        disabled={!canContinue()}
      >
        Continue 
      </button>
    </div>
  );
}

export default SelectProfessional;