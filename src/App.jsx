import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Services from "./pages/Services";
// import Time from "./pages/Time";
// import Professional from "./pages/Professionals";
import Payment from "./pages/Payment";
import Button from "./pages/Button";
import Layout from "./Layout";
// import Appoint from "./Clientsidepage/Appoint"

import Teammembers from "./Clientsidepage/Teammembers";
import Giftcards from "./Clientsidepage/Giftcards";
import Membership from "./Clientsidepage/Membership";
import ClientsList from "./Clientsidepage/Clientlist";
import Visit from "./pages/Visit";
import Todayandbody from "./Clientsidepage/Todayandbody";
import Memberss from "./Clientsidepage/Memberss";
import Dailysalesss from "./Clientsidepage/Dailysalesss";
import Paymentclient from "./Clientsidepage/Paymentclient";
import SalesPage from "./Clientsidepage/Salespage";
import TopService from "./Clientsidepage/Topservices";
import Dashboard from "./Clientsidepage/Dashboard";
import Sheduledshifts from "./Clientsidepage/Sheduledshifts";
import Graphs from "./Clientsidepage/Graphs";
import Selectcalander from "./Clientsidepage/Selectcalander";
import LoginPage from "./Clientsidepage/Loginpage";
import Signuppage from "./Clientsidepage/Signuppage";
import ForgotPassword from "./Clientsidepage/ForgotPassword";
import ResetPassword from "./Clientsidepage/ResetPassword";
import VerifyEmailPage from './pages/VerifyEmailPage';

// Import the new/updated components
import BookingFlow from "./pages/BookingFlow";
import SelectProfessional from "./pages/ProfessionalsUpdated";
// import TimeWithAPI from "./pages/TimeWithAPI";
import LayoutWithBooking from "./LayoutWithBooking";

// Import Stripe payment components
import StripePayment from "./pages/StripePayment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentProcess from "./pages/PaymentProcess";

// Import authentication components
import { AuthProvider } from "./Service/Context";
import ProtectedRoute from "./Components/ProtectedRoute";
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import ClientProfilePage from './pages/ClientProfilePage';
import Time from "./pages/TimeUpdated";

function App() {
  const [count, setCount] = useState(0);

  return (
    <AuthProvider>
    <BrowserRouter>
        <Routes>
          {/* Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<Signuppage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Main booking flow with LayoutWithBooking */}
          <Route path="/" element={
            <LayoutWithBooking>
              <Services />
            </LayoutWithBooking>
          } />
          
          <Route path="/professionals" element={
            <LayoutWithBooking>
              <SelectProfessional />
            </LayoutWithBooking>
          } />
          
          <Route path="/time" element={
            <LayoutWithBooking>
              <Time />
            </LayoutWithBooking>
          } />
          
          {/* Protected payment route - requires authentication */}
          <Route path="/payment" element={
            <ProtectedRoute>
              <LayoutWithBooking>
                <Payment />
              </LayoutWithBooking>
            </ProtectedRoute>
          } />

          {/* Test payment route without protection */}
          <Route path="/payment-test" element={<Payment />} />

          {/* Stripe Payment Routes */}
          <Route path="/payment/network" element={
            <ProtectedRoute>
              <StripePayment />
            </ProtectedRoute>
          } />
          
          <Route path="/payment/stripe" element={
            <ProtectedRoute>
              <StripePayment />
            </ProtectedRoute>
          } />
          
          <Route path="/payment/process" element={
            <ProtectedRoute>
              <PaymentProcess />
            </ProtectedRoute>
          } />
          
          <Route path="/payment/success" element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          } />
          
          <Route path="/payment/cancel" element={
            <ProtectedRoute>
              <PaymentCancel />
            </ProtectedRoute>
          } />

          {/* Dashboard route - requires authentication */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Alternative booking flow route */}
          <Route path="/booking" element={<BookingFlow />} />
          
          {/* Demo/test routes for updated components */}
          <Route path="/professionals-demo" element={<SelectProfessional />} />
          <Route path="/time-demo" element={<Time />} />
          
          {/* Legacy routes (commented out) */}
           {/* <Route path="/" element={<Visit/>} /> */}
          {/* <Route path="/" element={<Time/>} /> */}
          {/* <Route path="/" element={<Button/>} /> */}
          {/* <Route path="/" element={<Professional/>} /> */}
          {/* ----------------------------------------------------- */}
           {/* <Route path="/" element={<Appoint />} /> */}
            {/* <Route path="/" element={<Teammembers/>} /> */}
             {/* <Route path="/" element={<Giftcards/>} /> */}
             {/* <Route path="/" element={<Membership />} />   */}
              {/* <Route path="/" element={<ClientsList />} /> */}
               {/* <Route path="/" element={<Todayandbody/>} /> */}
               {/* <Route path="/" element={<Memberss />} />  */}
                {/* <Route path="/" element={<Dailysalesss />} />  */}
                {/* <Route path="/" element={<Paymentclient />} /> */}
                 {/* <Route path="/" element={<SalesPage/>} /> */}
                 {/* <Route path="/" element={<TopService/>} /> */}
                  {/* <Route path="/" element={<Sheduledshifts/>} /> */}
                   {/* <Route path="/" element={<Graphs/>} /> */}
                   {/* <Route path="/" element={<Selectcalander/>} /> */}
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/client-profile" element={<ClientProfilePage />} />
        </Routes>

    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
