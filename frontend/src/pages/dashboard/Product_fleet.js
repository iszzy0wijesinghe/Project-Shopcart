import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api"
import { Link, useNavigate } from "react-router-dom";
import "./Product.css";
import DashboardMenu from "../../components/MyDashboard/DashboardMenu";
import SearchBar from '../../contexes/SearchBar';

// vehicle type images
import bicycleimg from "../../components/bicycle.png";
import assignimg from "../../components/assign.png";

//driver profile image
import driverprofimg from "../../components/driver-image.png";
import uploaduserprofilebuttonimg from "../../components/upload-buttonimg.png";
import deleteuserprofileimgbuttonimg from "../../components/delete-buttonimg.png";

// ---------------- CHART IMPORTS BEGIN (ADDED) ----------------
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Inline styles for fleet management vehicle type images (unchanged)
const infoImgStyles = {
    Bicycle: { width: "43px", height: "43px" },
    Bike: { width: "40px", height: "40px" },
    TukTuk: { width: "35px", height: "30px", margin: "0px" },
    MiniVan: { width: "38px", height: "37px" },
    Van: { width: "50px", height: "50px" },
    Lorry4ft: { width: "40px", height: "40px" },
    Lorry7ft: { width: "40px", height: "50px" },
    Assigned: { width: "50px", height: "50px" },
};

const Product = () => {
    const navigate = useNavigate();

    // State controlling which container: product mgmt or fleet mgmt
    const [activeContainer, setActiveContainer] = useState("switchcontainer2");
    const [showRegisterDriver, setShowRegisterDriver] = useState(false);

    // State controlling fleet logic
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [selectedVehicleType, setSelectedVehicleType] = useState(null);
    const [vehicleInfo, setVehicleInfo] = useState({});
    const [drivers, setDrivers] = useState([]);
    const [filter, setFilter] = useState("available");
    const [searchQuery, setSearchQuery] = useState('');

    // For "see more" driver details
    const [showDetailedUI, setShowDetailedUI] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);

    // For driver metrics
    const [activeTab, setActiveTab] = useState(1);
    const [recentTrips, setRecentTrips] = useState([]);
    const [driverAvailability, setDriverAvailability] = useState([]);
    const [driverPerformance, setDriverPerformance] = useState(null);
    const [currentDelivery, setCurrentDelivery] = useState(null);

    // ---------------- CHART DATA & OPTIONS BEGIN (ADDED) ----------------
    const PerformanceChart = ({ data }) => {
        if (!data || data.length === 0) {
            return <p>No performance data available</p>;
        }

        // Extracting labels (dates) and values (ratings)
        const labels = data.map((trip) => new Date(trip.date).toLocaleDateString());
        const values = data.map((trip) => trip.rating);

        const chartData = {
            labels,
            datasets: [
                {
                    label: "Customer Average Rating",
                    data: values,
                    backgroundColor: "#ff6f00",
                    borderRadius: 6,
                    barPercentage: 0.5,
                },
            ],
        };

        const chartOptions = {
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 5,
                    ticks: { stepSize: 1 },
                    grid: { color: "#eee" },
                },
                x: { grid: { display: false } },
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: "performance metrics",
                    align: "start",
                    color: "#555",
                    font: { size: 14, weight: "bold" },
                    padding: { bottom: 10 },
                },
            },
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 0,
                    left: 20,
                },
            },
        };



        return <Bar data={chartData} options={chartOptions} />;
    };

    // New state for edit mode and editable fields
    const [editMode, setEditMode] = useState(false);
    const [driverTelephone, setDriverTelephone] = useState();
    const [driverEmail, setDriverEmail] = useState();
    const [fleetVehicleId, setFleetVehicleId] = useState();
    const [fleetColor, setFleetColor] = useState();
    const [fleetExpirationDate, setFleetExpirationDate] = useState();

    // fetching vehicle types
    useEffect(() => {
        const fetchVehicleTypes = async () => {
            try {
                const res = await api.get("/api/fleet/vehicles");
                const fetchedVehicles = res.data.data;
                setVehicleTypes(fetchedVehicles);

                // Set the first one as the selected type
                if (fetchedVehicles.length > 0) {
                    setSelectedVehicleType(fetchedVehicles[0]);
                }
                // console.log('vehicleTypes: ', fetchedVehicles);
                // console.log('selectedVehicleType: ', selectedVehicleType);
                // console.log('selectedVehicleTypeID: ', selectedVehicleType._id);
            } catch (error) {
                console.error("Error fetching vehicles", error);
            }
        };

        fetchVehicleTypes();
    }, []);

    // Keep vehicleInfo in sync with selected vehicle
    useEffect(() => {
        // Whenever selectedVehicleType changes, store it in vehicleInfo
        if (selectedVehicleType) {
            setVehicleInfo(selectedVehicleType);
        }
    }, [selectedVehicleType]);

    const fetchDrivers = async () => {
        try {
            const res = await api.get(
                `/api/fleet/drivers/${selectedVehicleType._id}`,
                { params: { filter, search: searchQuery } }
            );
            setDrivers(res.data);
        } catch (err) {
            console.error("Error fetching drivers", err);
        }
    };

    // fetch drivers when selectedVehicleType or filter changes
    useEffect(() => {
        if (!selectedVehicleType) return;
        const fetchDrivers = async () => {
            try {
                const res = await api.get(
                    `/api/fleet/drivers/${selectedVehicleType._id}`,
                    { params: { filter, search: searchQuery } }
                );
                setDrivers(res.data);
            } catch (err) {
                console.error("Error fetching drivers", err);
            }
        };
        
        fetchDrivers();
    }, [selectedVehicleType, filter, searchQuery]);

    // updating vehicle info
    const updateVehicleInfo = async () => {
        try {
            await api.put(`/api/fleet/vehicles/${selectedVehicleType._id}`, vehicleInfo);
            alert("Vehicle type updated successfully");
        } catch (error) {
            console.error("Error updating vehicle info", error);
        }
    };

    // For "see more" driver details
    const fetchDriverDetails = async (driverId) => {
        try {
            const tripsRes = await api.get(`/api/fleet/trips/recent/${driverId}`);
            setRecentTrips(tripsRes.data);

            const availabilityRes = await api.get(`/api/fleet/trips/availability/${driverId}`);
            setDriverAvailability(availabilityRes.data);

            const performanceRes = await api.get(`/api/fleet/drivers/performance/${driverId}`);
            setDriverPerformance(performanceRes.data);

            // const currentDeliveryRes = await api.get(`/api/fleet/trips/current/${driverId}`);
            // setCurrentDelivery(currentDeliveryRes.data);
        } catch (error) {
            console.error("Error fetching driver details", error);
        }
    };

    // when the see more button is clicked
    const handleSeeMore = (driver) => {
        setSelectedDriver(driver);
        // your code might store `driver.driverId` or a different field
        fetchDriverDetails(driver.driverId);
        setShowDetailedUI(true); // your original code's logic
    };

    // Return to the fleet main list
    const handleBack = () => {
        setShowDetailedUI(false);
        setSelectedDriver(null);
    };

    // registering a driver from the backend
    // const handleRegisterDriver = async () => {
    //     // basic front‐end validation (ensure required fields are filled)
    //     if (!name.trim())       return alert("Name is required");
    //     if (nic.length !== 12)   return alert("NIC must be 12 digits");
    //     if (drivingLicen.length !== 8) return alert("License must be 8 chars");
    //     if (!telephoneError && telephone === "+94") return alert("Phone is required");
    //     if (!email.endsWith("@gmail.com")) return alert("Valid @gmail.com email required");
    //     if (!address.trim())    return alert("Address is required");
    //     if (!vehicleTypeId)     return alert("Vehicle type is required");
    //     if (!engineNo.trim())   return alert("Engine No is required");
    //     if (!vehicleChassisNo.trim()) return alert("Chassis No is required");
    //     // …you can sprinkle in more validation as you like
      
    //     // assemble the payload exactly as your backend expects:
    //     const payload = {
    //       fullName:       name.trim(),
    //       nic,                             // assuming you’ll extend your controller to accept this
    //       dateOfBirth:   dob,              // if you have a dob field in state
    //       gender,                          // likewise
    //       phoneNumber:   telephone,
    //       emailAddress:  email,
    //       licenseNumber: drivingLicen,
    //       expirationDate: licenseExpiry,   // from your form state
    //       vehicleRegNo:  vehicleNumber,
    //       vehicleType:   vehicleTypeId,
    //       vehicleDetails: `Chassis: ${vehicleChassisNo}, Engine: ${engineNo}`,
    //       vehicleColor:  "black",          // default
    //       homeAddress:   address,
    //       emergencyContact: telephone,
    //       hireDate:      new Date(),       // created-at
    //       assignedShops: ["STORE1234"],
    //       employmentStatus: "active"
    //     };
      
    //     try {
    //       const { data } = await api.post("/api/catalog/drivers", payload);
    //       alert(data.message || "Driver registered!");
    //       // close the form & optionally refresh your driver list
    //       setShowRegisterDriver(false);
    //       // you might also want to re-fetch the `drivers` array here
    //     } catch (err) {
    //       console.error("Driver register failed:", err);
    //       alert("Failed to register driver. " + (err.response?.data?.error || err.message));
    //     }
    //   };

    // Pass between the metrics
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    // Update the driver db, with changed values
    const handleSave = () => {
        // If user is just pressing "Back" or "Save" from editMode, you might do:
        // if (editMode) {
        //   try {
        //     await api.put(`/api/fleet/drivers/${selectedDriver.driverId}`, {
        //       phoneNumber: driverTelephone,
        //       emailAddress: driverEmail,
        //       vehicleRegNo: fleetVehicleId,
        //       vehicleColor: fleetColor,
        //       expirationDate: fleetExpirationDate,
        //       // any other fields you want to update
        //     });
        //     alert("Driver info updated successfully!");
        //   } catch (error) {
        //     console.error("Error updating driver:", error);
        //   }
        // }
        setEditMode(false);
        setShowDetailedUI(false);
        // navigate("/dashboard-shopowner/productManagement");
    };

    // modal visibility + selected reason
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteReason, setDeleteReason] = useState("");


    const handleDeleteEmployment = async () => {
        if (!selectedDriver || !deleteReason) return;
        try {
            await api.delete(`/api/fleet/drivers/delete-driver/${selectedDriver._id}`, {
                data: { reason: deleteReason }
            });
            alert("Driver record deleted");
            setDrivers(drivers.filter(d => d.driverId !== selectedDriver.driverId));
            setShowDeleteConfirm(false);
            setShowDetailedUI(false);
            setDeleteReason("");
        } catch (err) {
            console.error(err);
            alert("Failed to delete");
        }
    };


    // Driver Registration Form (We'll render it only when showRegisterDriver is true.)
    const RegisterDriverCopyContainer = ({
        selectedVehicleType,
        vehicleTypes,
        onSuccess,    // callback to refresh driver list & hide form
    }) => {

        // Add these lines at about line 516–517 inside RegisterDriverCopyContainer
        const [nic, setNic] = useState("");
        const [nicError, setNicError] = useState("");

        const [dob, setDob] = useState("");
        const [dobError, setDobError] = useState("");

        const [drivingLicen, setDrivingLicen] = useState("");
        const [drivingLicenError, setDrivingLicenError] = useState("");

        const [drivingLicenExpiry, setDrivingLicenExpiry] = useState("");
        const [drivingLicenExpiryError, setDrivingLicenExpiryError] = useState("");

        const [gender, setGender] = useState("");
        const [genderError, setGenderError] = useState("");

        // Allowed area codes in international format (without the 0)
        const allowedAreaCodes = ["11", "21", "31", "33", "34", "41", "45", "47", "55", "57", "63", "65"];

        // Update your telephone state and error state if not already declared
        const [telephone, setTelephone] = useState("+94");
        const [telephoneError, setTelephoneError] = useState("");

        const [email, setEmail] = useState("");
        const [emailError, setEmailError] = useState("");

        const [name, setName] = useState("");
        const [nameError, setNameError] = useState("");

        // Fleet info states
        const [vehicleNumber, setVehicleNumber] = useState("");
        const [vehicleNumberError, setVehicleNumberError] = useState("");

        const [vehicleTypeId, setVehicleTypeId] = useState(
              vehicleTypes[0]?._id || ""
            );
        const [vehicleTypeError, setVehicleTypeError] = useState("");
        const [address, setAddress] = useState("");
        const [addressError, setAddressError] = useState("");

        const [vehicleBrand, setVehicleBrand] = useState("");
        const [vehicleBrandError, setVehicleBrandError] = useState("");

        const [vehicleModel, setVehicleModel] = useState("");
        const [vehicleModelError, setVehicleModelError] = useState("");

        const [engineNo, setEngineNo] = useState("");
        const [engineNoError, setEngineNoError] = useState("");

        const [vehicleChassisNo, setVehicleChassisNo] = useState("");
        const [vehicleChassisNoError, setVehicleChassisNoError] = useState("");

        const [insurance, setInsurance] = useState("");
        const [insuranceError, setInsuranceError] = useState("");

        // —–––– Profile photo upload
        const [profilePhoto, setProfilePhoto] = useState(null);
        const fileInputRef = useRef();
        //frontend handlerws line 337
        // Add these lines at about line 518–525

        
        const validateVehicleType = () => {
            if (!vehicleTypeId) {
            setVehicleTypeError("Please select a vehicle type.");
            return false;
            }
            setVehicleTypeError("");
            return true;
        };
    
        const validateAddress = () => {
            if (!address.trim()) {
            setAddressError("Address is required.");
            return false;
            }
            setAddressError("");
            return true;
        };

        const handleNICChange = (e) => {
            const input = e.target.value;
            // Allow only digits up to 12 characters
            const nicRegex = /^\d{0,12}$/;
            if (nicRegex.test(input)) {
                setNic(input);
                setNicError("");
            } else {
                setNicError("NIC must contain only digits (max 12).");
            }
        };

        const validateNIC = () => {
            if (nic.length !== 12) {
                setNicError("NIC should contain exactly 12 digits.");
            } else {
                setNicError("");
            }
        };

        const handleGenderChange = (e) => {
            setGender(e.target.value);
            if (genderError) setGenderError("");
        };


        const handleDobChange = (e) => {
            setDob(e.target.value);
            // optional: clear existing error as user types
            if (dobError) setDobError("");
        };

        // Lines 526–530
        const handleDrivingLicenChange = (e) => {
            const input = e.target.value;
            // Allows letters and digits up to 8 characters
            const licenRegex = /^[A-Za-z0-9]{0,8}$/;
            if (licenRegex.test(input)) {
                setDrivingLicen(input);
                setDrivingLicenError("");
            } else {
                setDrivingLicenError("Driving Licen must contain only letters and digits (max 8).");
            }
        };

        const handleDrivingLicenExpiryChange = (e) => {
            setDrivingLicenExpiry(e.target.value);
            if (drivingLicenExpiryError) setDrivingLicenExpiryError("");
        };

        const validateDrivingLicen = () => {
            if (drivingLicen.length !== 8) {
                setDrivingLicenError("Driving Licen must contain exactly 8 characters.");
            } else {
                setDrivingLicenError("");
            }
        };


        // When the telephone input changes:
        const handleTelephoneChange = (e) => {
            let input = e.target.value;

            // If the input doesn't start with +94, enforce it.
            if (!input.startsWith("+94")) {
                input = "+94" + input.replace(/^(\+?94)?/, "");
            } else {
                // Remove any non-digit characters from the local part (keeping +94 intact)
                input = "+94" + input.slice(3).replace(/\D/g, "");
            }

            // Limit the local part (after +94) to 9 digits
            const localPart = input.slice(3, 12); // take only 9 digits maximum
            const newInput = "+94" + localPart;
            setTelephone(newInput);
        };

        // Validate on blur or on form submission:
        const validateTelephone = () => {
            // Check that telephone is not empty (beyond +94)
            if (telephone.trim() === "" || telephone === "+94") {
                setTelephoneError("Telephone is required.");
                return false;
            }
            // Extract the local part (digits after +94)
            const localPart = telephone.slice(3);
            if (localPart.length !== 9) {
                setTelephoneError("Telephone must be exactly 9 digits after +94.");
                return false;
            }
            // Validate the area code by checking the first 2 digits.
            // (For example, if the user should have typed 011, after +94 it must be "11".)
            const areaCode = localPart.slice(0, 2);
            if (!allowedAreaCodes.includes(areaCode)) {
                setTelephoneError("Telephone area code is invalid.");
                return false;
            }
            setTelephoneError(""); // Clear error if all validations pass
            return true;
        };

        // Add these lines after your other handlers (approximate lines 531–535)
        const handleNameChange = (e) => {
            const input = e.target.value;
            // Allow only alphabets and spaces (change the regex if you need to allow other characters)
            const nameRegex = /^[A-Za-z\s]*$/;
            if (nameRegex.test(input)) {
                setName(input);
                setNameError("");
            } else {
                setNameError("Name can only contain alphabetical characters and spaces.");
            }
        };

        const validateName = () => {
            // Final validation can check for non-empty value if required
            if (name.trim() === "") {
                setNameError("Name cannot be empty.");
            } else if (!/^[A-Za-z\s]+$/.test(name)) {
                setNameError("Name can only contain alphabetical characters and spaces.");
            } else {
                setNameError("");
            }
        };

        // Updated Email Handlers (approximate lines 536–540)
        const handleEmailChange = (e) => {
            const input = e.target.value;
            // Check if the input is empty or already ends with '@gmail.com'
            if (input === "" || input.endsWith("@gmail.com")) {
                setEmail(input);
                setEmailError("");
            } else {
                setEmail(input);
                setEmailError("Email must end with @gmail.com.");
            }
        };


        const validateDrivingLicenExpiry = () => {
            if (!drivingLicenExpiry) {
                setDrivingLicenExpiryError("Expiration date is required");
            } else if (new Date(drivingLicenExpiry) < new Date()) {
                setDrivingLicenExpiryError("Expiration date can’t be in the past");
            } else {
                setDrivingLicenExpiryError("");
            }
        };

        const validateEmail = () => {
            // Final check on blur: the email must end with '@gmail.com'
            if (!email.endsWith("@gmail.com")) {
                setEmailError("Email must end with @gmail.com.");
            } else {
                setEmailError("");
            }
        };


        // Fleet field handlers and validations
        const handleVehicleNumberChange = (e) => {
            const input = e.target.value;
            setVehicleNumber(input);
            if (input.trim() === "") {
                setVehicleNumberError("Vehicle Number is required.");
            } else {
                setVehicleNumberError("");
            }
        };


        const validateDob = () => {
            if (!dob) {
                setDobError("Date of birth is required");
            } else if (new Date(dob) > new Date()) {
                setDobError("Date of birth cannot be in the future");
            } else {
                setDobError("");
            }
        };


        const validateGender = () => {
            if (!gender) {
                setGenderError("Please select a gender");
            } else {
                setGenderError("");
            }
        };

        const validateVehicleNumber = () => {
            if (vehicleNumber.trim() === "") {
                setVehicleNumberError("Vehicle Number is required.");
            } else {
                setVehicleNumberError("");
            }
        };

        const handleVehicleBrandChange = (e) => {
            const input = e.target.value;
            setVehicleBrand(input);
            if (input.trim() === "") {
                setVehicleBrandError("Vehicle Brand is required.");
            } else {
                setVehicleBrandError("");
            }
        };

        const validateVehicleBrand = () => {
            if (vehicleBrand.trim() === "") {
                setVehicleBrandError("Vehicle Brand is required.");
            } else {
                setVehicleBrandError("");
            }
        };

        const handleVehicleModelChange = (e) => {
            const input = e.target.value;
            setVehicleModel(input);
            if (input.trim() === "") {
                setVehicleModelError("Vehicle Model is required.");
            } else {
                setVehicleModelError("");
            }
        };

        const validateVehicleModel = () => {
            if (vehicleModel.trim() === "") {
                setVehicleModelError("Vehicle Model is required.");
            } else {
                setVehicleModelError("");
            }
        };

        const handleEngineNoChange = (e) => {
            const input = e.target.value;
            setEngineNo(input);
            if (input.trim() === "") {
                setEngineNoError("Engine No is required.");
            } else {
                setEngineNoError("");
            }
        };

        const validateEngineNo = () => {
            if (engineNo.trim() === "") {
                setEngineNoError("Engine No is required.");
            } else {
                setEngineNoError("");
            }
        };

        const handleVehicleChassisNoChange = (e) => {
            const input = e.target.value;
            setVehicleChassisNo(input);
            if (input.trim() === "") {
                setVehicleChassisNoError("Vehicle Chassis No is required.");
            } else {
                setVehicleChassisNoError("");
            }
        };

        const validateVehicleChassisNo = () => {
            if (vehicleChassisNo.trim() === "") {
                setVehicleChassisNoError("Vehicle Chassis No is required.");
            } else {
                setVehicleChassisNoError("");
            }
        };

        const handleInsuranceChange = (e) => {
            const input = e.target.value;
            setInsurance(input);
            if (input.trim() === "") {
                setInsuranceError("Insurance selection is required.");
            } else {
                setInsuranceError("");
            }
        };

        // —— file upload —— //
        const onFileSelect = e => {
            const file = e.target.files[0];
            if (file) setProfilePhoto(file);
        };

        // —— final submit —— //
        const handleRegister = async (e) => {
            e.preventDefault()
            // const ok =
            //     validateName() &
            //     validateNIC() &
            //     validateDrivingLicen() &
            //     // validateTelephone() &
            //     validateEmail() &
            //     validateVehicleNumber() &
            //     validateVehicleType() &
            //     validateEngineNo() &
            //     validateVehicleChassisNo() &
            //     validateAddress();
            // if (!ok) return;

            try {
                const payload = {
                    fullName: name.trim(),
                    dateOfBirth: dob,
                    gender: gender,
                    phoneNumber: telephone,
                    emailAddress: email.trim(),
                    drivingLicenseNo: drivingLicen,
                    licenseExpiry: drivingLicenExpiry,    // if you have this state
                    vehicleRegNo: vehicleNumber,
                    vehicleType: vehicleTypeId,
                    vehicleDetails: `Chassis: ${vehicleChassisNo}, Engine: ${engineNo}`,
                    homeAddress: address.trim(),
                  };

                const res = await api.post("/api/fleet/drivers/create-driver", payload);

                if (res.data.success) {
                    alert("Registration Successful");
                    onSuccess();      // e.g. close form + re‐load drivers
                }
            } catch (err) {
                console.error("Registration failed:", err.response?.data || err.message);
            } finally {
                // setShowRegisterDriver(false);
            }
        };

        return (
            <form className="register-driver-copy-container">
                <div className="register-driver-scroll">
                    <div className="register-driver-icon-top">
                        <img
                            src={selectedVehicleType?.picture}
                            alt={selectedVehicleType?.typeName}
                            width="50px"
                            height="50px"
                        />
                        <div className="imgname">Register New Driver</div>
                    </div>

                    <div className="add-driver-top-row-vehicle">
                        <div className="add-driver-top-row-vehicle-img">
                            <div className="add-driver-user-profile-image">
                                {/* Profile photo upload */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    ref={fileInputRef}
                                    onChange={onFileSelect}
                                />

                                <img
                                    src={driverprofimg}
                                    width="110px"
                                    height="110px"
                                    alt="Driver Profile"
                                />

                                <div className="add-driver-image-buttons">
                                    <button
                                        className="add-driver-upload-button-image"
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}>
                                        <img
                                            className="add-driver-upload-icon"
                                            src={uploaduserprofilebuttonimg}
                                            alt="Upload"
                                        />
                                        <div className="add-driver-upload-button-text">Upload</div>
                                    </button>
                                    {profilePhoto && (
                                        <button className="add-driver-remove-button-image">
                                            <img
                                                className="add-driver-remove-icon"
                                                src={deleteuserprofileimgbuttonimg}
                                                alt="Remove"
                                            />
                                            <div className="add-driver-delete-button-text">Remove</div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="add-driver-top-row-vehicle-section-devider">
                            <div className="add-driver-personal-info-card-block">
                                <div className="add-driver-info-card-titile">
                                    <h3>Personal Information</h3>
                                </div>
                                <div className="add-driver-info-card-detail-row">
                                    <p>
                                        <span className="add-driver-info-label">Name:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter name here"
                                            value={name}
                                            onChange={handleNameChange}
                                            onBlur={validateName}
                                            required
                                        />
                                        {nameError && (
                                            <span
                                                className="error-message"
                                                style={{ color: "red", fontSize: "12px", display: "block", marginTop: "4px" }}
                                            >
                                                {nameError}
                                            </span>
                                        )}

                                    </p>
                                </div>
                                <div className="add-driver-info-card-detail-row">
                                    <p>
                                        <span className="add-driver-info-label">National Identity Card Number (NIC):</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter NIC here"
                                            value={nic}                  // new attribute
                                            onChange={handleNICChange}   // new attribute
                                            onBlur={validateNIC}         // new attribute
                                        />
                                        {nicError && (
                                            <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                                {nicError}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="add-driver-info-card-detail-row">
                                    <p>
                                        <span className="add-driver-info-label">Date of Birth:</span>
                                        <input
                                            type="date"
                                            className="info-input"
                                            value={dob}
                                            onChange={handleDobChange}
                                            onBlur={validateDob}
                                            required
                                        />
                                        {dobError && (
                                            <span
                                                className="error-message"
                                                style={{
                                                    color: "red",
                                                    fontSize: "12px",
                                                    display: "block",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                {dobError}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="add-driver-info-card-detail-row">
                                    <p>
                                        <span className="add-driver-info-label">Gender:</span>
                                        <div className="add-driver-info-card-detail-row-short-radio">
                                            <label style={{ marginRight: "1rem" }}>
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value="male"
                                                    checked={gender === "male"}
                                                    onChange={handleGenderChange}
                                                    onBlur={validateGender}
                                                />{" "}
                                                Male
                                            </label>

                                            <label style={{ marginRight: "1rem" }}>
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value="female"
                                                    checked={gender === "female"}
                                                    onChange={handleGenderChange}
                                                    onBlur={validateGender}
                                                />{" "}
                                                Female
                                            </label>

                                            <label>
                                                <input
                                                    type="radio"
                                                    name="gender"
                                                    value="other"
                                                    checked={gender === "other"}
                                                    onChange={handleGenderChange}
                                                    onBlur={validateGender}
                                                />{" "}
                                                Other
                                            </label>

                                            {genderError && (
                                                <span
                                                    className="error-message"
                                                    style={{
                                                        color: "red",
                                                        fontSize: "12px",
                                                        display: "block",
                                                        marginTop: "4px",
                                                    }}
                                                >
                                                    {genderError}

                                                </span>
                                            )}
                                        </div>
                                    </p>
                                </div>

                                <div className="add-driver-info-card-detail-row">
                                    <p>
                                        <span className="add-driver-info-label">Telephone:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter telephone number"
                                            value={telephone}
                                            onChange={handleTelephoneChange}
                                            onBlur={validateTelephone}
                                        />
                                        {telephoneError && (
                                            <span className="error-message">{telephoneError}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="add-driver-info-card-detail-row">
                                    <p>
                                        <span className="add-driver-info-label">Email:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter email here"
                                            value={email}
                                            onChange={handleEmailChange}
                                            onBlur={validateEmail}
                                        />
                                        {emailError && (
                                            <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                                {emailError}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="add-driver-info-card-detail-row">
                                    <p>
                                        <span className="add-driver-info-label">Address:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter address here"
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            onBlur={validateAddress}
                                        />
                                        {addressError && <span className="error-message">{addressError}</span>}
                                    </p>
                                </div>
                            </div>


                            <div className="add-driver-fleet-info-card-block">
                                <div className="add-driver-info-card-titile">
                                    <h3>Fleet Information</h3>
                                </div>

                                <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label-vehicle">Driving Licen Number:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter driving licen number here"
                                            value={drivingLicen}
                                            onChange={handleDrivingLicenChange}
                                            onBlur={validateDrivingLicen}
                                        />
                                        {drivingLicenError && (
                                            <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                                {drivingLicenError}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label-vehicle">License Expiry:</span>
                                        <input
                                            type="date"
                                            className="info-input"
                                            value={drivingLicenExpiry}
                                            onChange={handleDrivingLicenExpiryChange}
                                            onBlur={validateDrivingLicenExpiry}
                                            required
                                        />
                                        {drivingLicenExpiryError && (
                                            <span
                                                className="error-message"
                                                style={{
                                                    color: "red",
                                                    fontSize: "12px",
                                                    display: "block",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                {drivingLicenExpiryError}
                                            </span>
                                        )}
                                    </p>
                                </div>


                                <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label-vehicle">Vehicle Number:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter vehicle number here"
                                            value={vehicleNumber}
                                            onChange={handleVehicleNumberChange}
                                            onBlur={validateVehicleNumber}
                                        />
                                    </p>
                                    {vehicleNumberError && (
                                        <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                            {vehicleNumberError}
                                        </span>
                                    )}
                                </div>

                                {/* <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label-vehicle">Vehicle Brand:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter vehicle brand here"
                                            value={vehicleBrand}
                                            onChange={handleVehicleBrandChange}
                                            onBlur={validateVehicleBrand}
                                        />
                                    </p>
                                    {vehicleBrandError && (
                                        <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                            {vehicleBrandError}
                                        </span>
                                    )}
                                </div> */}

                                <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label-vehicle">Vehicle Type:</span>
                                        <select
                                            className="info-input"
                                            value={vehicleTypeId}
                                            onChange={e => setVehicleTypeId(e.target.value)}
                                            onBlur={validateVehicleType}
                                        >
                                        <option value="" disabled>Select vehicle type</option>
                                        {vehicleTypes.map(v => (
                                            <option key={v._id} value={v._id}>
                                            {v.typeName}
                                            </option>
                                        ))}
                                        </select>
                                    </p>
                                    {vehicleTypeError && <span className="error-message">{vehicleTypeError}</span>}
                                </div>

                                <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label-vehicle">Engine No:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter vehicle engine number here"
                                            value={engineNo}
                                            onChange={handleEngineNoChange}
                                            onBlur={validateEngineNo}
                                        />
                                    </p>
                                    {engineNoError && (
                                        <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                            {engineNoError}
                                        </span>
                                    )}
                                </div>

                                <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label-vehicle">Vehicle Chassis No:</span>
                                        <input
                                            type="text"
                                            className="info-input"
                                            placeholder="Enter vehicle chassis number here"
                                            value={vehicleChassisNo}
                                            onChange={handleVehicleChassisNoChange}
                                            onBlur={validateVehicleChassisNo}
                                        />
                                    </p>
                                    {vehicleChassisNoError && (
                                        <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                            {vehicleChassisNoError}
                                        </span>
                                    )}
                                </div>

                                <div className="add-driver-info-card-detail-row-short">
                                    <p>
                                        <span className="add-driver-info-label">Vehicle Insurrance Type:</span>
                                        <div className="add-driver-info-card-detail-row-short-radio">
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="insurance"
                                                    value="full-insured"
                                                    onChange={handleInsuranceChange}
                                                />
                                                Full
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="insurance"
                                                    value="third-party-insured"
                                                    onChange={handleInsuranceChange}
                                                />
                                                Third Party
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="insurance"
                                                    value="not-insured"
                                                    onChange={handleInsuranceChange}
                                                />
                                                Not Insured
                                            </label>
                                        </div>
                                        {insuranceError && (
                                            <span className="error-message" style={{ color: "red", fontSize: "12px" }}>
                                                {insuranceError}
                                            </span>
                                        )}
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* On clicking this, we close the container and re-enable vehicle tabs */}
                    <div className="add-driver-update-button-div">
                        <button
                            className="add-driver-update-button"
                            type="submit"
                            onClick={handleRegister}
                        >
                            Register Driver
                        </button>
                    </div>
                </div>
            </form>

        );
    };

    return (
        <div className="product-management">


            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <header className="modal-header">
                            <h2>Confirm Deletion</h2>
                            <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                                &times;
                            </button>
                        </header>

                        <div className="modal-body">
                            <p>Please select a reason for deleting this driver:</p>
                            <select
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                            >
                                <option value="" disabled>– Select a reason –</option>
                                <option value="Driver leaving the platform">Driver leaving the platform</option>
                                <option value="Driver's Discipline Issues">Driver’s Discipline Issues</option>
                                <option value="Lower Rating">Lower Rating</option>
                                <option value="Late delivery">Late delivery</option>
                            </select>

                            {/* Buttons moved into the body, stacked */}
                            <div className="modal-body-buttons">
                                <button
                                    className="btn-delete"
                                    disabled={!deleteReason}
                                    onClick={handleDeleteEmployment}
                                >
                                    Yes, delete
                                </button>
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}




            <DashboardMenu />
            <div className="maincontainer">

                {/* swiching btw product and fleet */}
                <div className="switch">
                    <div
                        className={`s1main ${activeContainer === "switchcontainer1" ? "active" : ""
                            }`}
                        // onClick={() => setActiveContainer("switchcontainer1")}
                        onClick={() => {
                            setActiveContainer("switchcontainer1");  // Update the active container
                            navigate('/dashboard-shopowner/productManagement');  // Navigate to Fleet Management page
                        }}
                    >
                        <div className="s1sub">Product Management</div>
                    </div>
                    <div
                        className={`s2main ${activeContainer === "switchcontainer2" ? "active" : ""
                            }`}
                        // onClick={() => setActiveContainer("switchcontainer2")}
                        onClick={() => {
                            setActiveContainer("switchcontainer2");  // Update the active container
                            navigate('/dashboard-shopowner/fleetManagement');  // Navigate to Fleet Management page
                        }}
                    >
                        <div className="s2sub">Fleet Management</div>
                    </div>
                </div>
                <div className="slider"
                    style={{
                        transform:
                            activeContainer === "switchcontainer1"
                                ? "translateX(0%)"
                                : "translateX(-50%)",
                    }}
                >

                    {/* product management */}
                    <div className="switchcontainer1" style={{ width: "50%" }}>
                        <div className="breadcrumbs">
                            Dashboard &gt; Feed &gt; Product Management
                        </div>
                        {/* <div className="category">
              <div className="heading">All Products Available At GOCART Store</div>
              <div className="slots-container">
                <button
                  className="scroll-left"
                  onClick={() => {
                    const slots = document.querySelector(".slots");
                    slots.scrollBy({ left: -156, behavior: "smooth" });
                  }}
                >
                  <i className="fi fi-bs-angle-left"></i>
                </button>
                <div className="slots">
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Vegetables")}
                  >
                    <div className="img">
                      <img
                        src={logoVeg}
                        alt="Vegetables"
                        width="55px"
                        height="55px"
                      />
                    </div>
                    <div className="title">Vegetables</div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Fruits")}
                  >
                    <div className="img">
                      <img
                        src={logoFruit}
                        alt="Fruits"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">Fruits</div>
                  </button>
                  <button className="card" onClick={() => setActiveSlot("Meat")}>
                    <div className="img">
                      <img
                        src={logoMeat}
                        alt="Meat"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">Meat</div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Fish")}
                  >
                    <div className="img">
                      <img
                        src={logoFish}
                        alt="Fish"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">Fish</div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Dairy")}
                  >
                    <div className="img">
                      <img
                        src={logoMilk}
                        alt="Dairy"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">Dairy</div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Laundry & Cleaning")}
                  >
                    <div className="img">
                      <img
                        src={logoClean}
                        alt="Laundry & Cleaning"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">
                      Laundry & <br /> Cleaning
                    </div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Snacks & Sweets")}
                  >
                    <div className="img">
                      <img
                        src={logoSweet}
                        alt="Snacks & Sweets"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">
                      Snacks & <br /> Sweets
                    </div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Staples")}
                  >
                    <div className="img">
                      <img
                        src={logoStaples}
                        alt="Staples"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">Staples</div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Spices")}
                  >
                    <div className="img">
                      <img
                        src={logoSpices}
                        alt="Spices"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">Spices</div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Beverages")}
                  >
                    <div className="img">
                      <img
                        src={logoBev}
                        alt="Beverages"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">Beverages</div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Personal Care")}
                  >
                    <div className="img">
                      <img
                        src={logoPersonalC}
                        alt="Personal Care"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">
                      Personal <br /> Care
                    </div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setActiveSlot("Frozen Foods")}
                  >
                    <div className="img">
                      <img
                        src={logoFrozen}
                        alt="Frozen Foods"
                        width="50px"
                        height="50px"
                      />
                    </div>
                    <div className="title">
                      Frozen <br /> Foods
                    </div>
                  </button>
                </div>
                <button
                  className="scroll-right"
                  onClick={() => {
                    const slots = document.querySelector(".slots");
                    slots.scrollBy({ left: 156, behavior: "smooth" });
                  }}
                >
                  <i className="fi fi-bs-angle-right"></i>
                </button>
              </div>
            </div> */}
                        {/* <div className="full_view">
              <div className="changecont">
                <div className="headingchange">{activeSlot}</div>
                <div className="scrollcards">
                  {getScardsForSlot(activeSlot).map((card, index) => (
                    <div
                      className="scards"
                      key={card.id}
                      onClick={() => handleScardClick(index)}
                    >
                      <div className="left-section">
                        <div className="top-row">
                          <div className="toprowicon">
                            <i
                              className="fi fi-rr-clock"
                              style={{ fontSize: "15px" }}
                            />
                          </div>
                          <span className="last-edited">
                            &nbsp;Last Edited <br />
                            {card.lastEdited || "N/A"}
                          </span>
                        </div>
                        <img
                          className="card-image"
                          src={card.imageUrl}
                          width="70px"
                          height="70px"
                          alt={card.name}
                        />
                      </div>
                      <div className="right-section">
                        <h2 className="card-price">{card.price}</h2>
                        <p className="card-name">{card.name}</p>
                        <p className="card-weight">{card.weight}</p>
                        <div className="card-badges">
                          <span className="discount-badge">{card.discount}</span>
                          <span className="availability-badge">
                            {card.availability}
                          </span>
                        </div>
                        <button
                          className="card-edit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderCardInSubset(
                              card,
                              scards,
                              setScards,
                              activeSlot
                            );
                            setSelectedCard(card);
                          }}
                        >
                          <i className="fi fi-rr-edit"></i>&nbsp;Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="fixedcont">
                {selectedCard && (
                  <div className="fixedcont-inner">
                    <div className="fixe4dtopHeading">Edit Details </div>
                    <div className="fixedtop">
                      <img
                        src={selectedCard.imageUrl}
                        alt={selectedCard.name}
                        className="fixedcont-img"
                      />
                      <div className="fixedtopoinner">
                        <h2 className="fixedcont-title">{selectedCard.name}</h2>
                        <div className="fixedcont-lastEdited">
                          <i className="fi fi-rr-clock" />
                          <span>Last Edited {selectedCard.lastEdited}</span>
                        </div>
                      </div>
                    </div>
                    <div className="price-input-wrapper">
                      <label className="fixedcont-label">
                        Price Before Discount
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter price for ${selectedCard.weight}`}
                        className="fixedcont-input"
                      />
                    </div>
                    <div className="price-input-wrapper">
                      <label className="fixedcont-label">
                        Price After Discount
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter price for ${selectedCard.weight}`}
                        className="fixedcont-input"
                      />
                    </div>
                    <div className="fixedcont-availability">
                      <label>
                        <input
                          type="radio"
                          name="availability"
                          value="Available"
                          defaultChecked={
                            selectedCard.availability === "Available"
                          }
                        />
                        Available
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="availability"
                          value="Unavailable"
                          defaultChecked={
                            selectedCard.availability !== "Available"
                          }
                        />
                        Unavailable
                      </label>
                    </div>
                    <button className="fixedcont-btn">Edit details</button>
                  </div>
                )}
              </div>
            </div> */}
                    </div>

                    {/* fleet management */}
                    <div className="switchcontainer2" style={{ width: "50%" }}>

                        {/* top vehicle type section */}
                        <div className="fleettopcontrol">

                            {/* breadcrumbs */}
                            <div className="fleettopcont">
                                <div className="breadcrumbs">
                                    Dashboard &gt; Feed &gt; Fleet Management
                                </div>
                                <div className="headingfleet">All Types of Vehicle Types</div>
                            </div>

                            {/* vehicle Types section(lock tabs if we're showing the register-driver container) */}
                            {!showDetailedUI && (
                                <div className="category-fleet"
                                    style={{
                                        pointerEvents: showRegisterDriver ? "none" : "auto",
                                    }}
                                >
                                    {/* vehicle types from backend */}
                                    <div className="vehicle-type-tabs">
                                        {vehicleTypes.map((vehicle) => (
                                            <div
                                                key={vehicle._id}
                                                className={`vehicle-type ${selectedVehicleType?._id === vehicle._id ? "active" : ""
                                                    }`}
                                                onClick={() => setSelectedVehicleType(vehicle)}
                                            >
                                                <img
                                                    src={vehicle?.picture || bicycleimg}
                                                    alt={vehicle.typeName}
                                                    width="50px"
                                                    height="50px"
                                                />
                                                <span>{vehicle.typeName}</span>
                                            </div>
                                        ))}
                                        {/* assigned button */}
                                        <div
                                            key={selectedVehicleType?._id ? selectedVehicleType._id : ""}
                                            className={`vehicle-type ${filter === "assigned" ? "active" : ""}`}
                                            onClick={() => setFilter(filter === "assigned" ? "available" : "assigned")}
                                        >
                                            <img
                                                src={assignimg}
                                                alt="Assigned"
                                                width="70px"
                                                height="70px"
                                            />
                                            <span>Assigned</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* lock the register-new-driver button if assigned is selected and hide it if showDetailedUI is true*/}
                            <div className="register-new-driver"
                                tabindex="0"
                                onClick={() => setShowRegisterDriver(true)}
                                style={{
                                    pointerEvents:
                                        selectedVehicleType?.typeName === "Assigned" ? "none" : "auto",
                                    display: showDetailedUI ? "none" : "block",
                                }}
                            >

                                {/* register driver button */}
                                <div className="register-new-driver-button">
                                    <div className="register-new-driver-image">

                                        <i class="fi fi-rr-user-add" height="45px" width="45px" alt="reg"></i>
                                    </div>
                                    <div className="register-new-driver-text">
                                        Register
                                        <br />
                                        Driver
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Vehice types and driver table section */} {/* If we are not in "Detailed UI" mode */}
                        {!showDetailedUI ? (
                            <div className="switch-vehicle-container1">
                                <div className="vehicle-switch-container">
                                    {/* Hide vehicle-info and table if new-driver container is active */}
                                    {!showRegisterDriver && (
                                        <div className="vehicle-info">

                                            {/* vehicles info section */}
                                            <div className="align-container">
                                                <div className="info-img">
                                                    <img
                                                        src={selectedVehicleType?.picture}
                                                        alt={selectedVehicleType?.typeName}
                                                        style={infoImgStyles[selectedVehicleType?.typeName.replace(/\s/g, '')]}
                                                    />
                                                </div>
                                                <div className="info-item-name">
                                                    {selectedVehicleType?.typeName}
                                                </div>
                                                <div className="info-item">
                                                    Total weight :{" "}
                                                    <div className="item-count">
                                                        {selectedVehicleType?.totalWeightCapacity}
                                                    </div>
                                                </div>
                                                <div className="info-item">
                                                    Capacity box or crate :{" "}
                                                    <div className="item-count">
                                                        {selectedVehicleType?.boxCapacity}
                                                    </div>
                                                </div>
                                                <div className="info-item-rate">
                                                    Rate per Km :{" "}
                                                    <div className="item-count">
                                                        {selectedVehicleType?.ratePerKM}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* vehicles info update button */}
                                            <div className="button-div-update">
                                                <button className="update-button">Update details</button>
                                            </div>

                                            {/* vehicles search bar */}
                                            <div className="search-div-holder">
                                                <SearchBar
                                                    searchQuery={searchQuery}
                                                    setSearchQuery={setSearchQuery}
                                                />
                                            </div>

                                        </div>
                                    )}
                                    {!showRegisterDriver && (
                                        // drivers table for the selected vehicle type
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Category</th>
                                                        <th>Shop owner rate</th>
                                                        <th>Customer Average rating</th>
                                                        <th>Recommended status</th>
                                                        <th>Assigned status</th>
                                                        <th>see more</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {drivers && drivers.length > 0 ? (
                                                        drivers.map((driver) => (
                                                            <tr key={driver.driverId}>
                                                                <td>{driver.fullName}</td>
                                                                <td>
                                                                    <img src={selectedVehicleType?.picture} alt="icon" width="30" />
                                                                </td>
                                                                <td>{driver.averageRatings?.customer?.average_rating.toFixed(2) || "N/A"}</td>
                                                                <td>{driver.averageRatings?.shopOwner?.average_rating.toFixed(2) || "N/A"}</td>
                                                                <td>{driver.recommend_status}</td>
                                                                <td>{driver.availability.status}</td>
                                                                <td>
                                                                    <a
                                                                        href="#0"
                                                                        className="see-more-link"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handleSeeMore(driver);
                                                                        }}
                                                                    >
                                                                        see more
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="no-drivers">
                                                                No drivers available.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Show the partial copy container if showRegisterDriver = true */}
                                    {/* {showRegisterDriver && <RegisterDriverCopyContainer />} */}
                                    {showRegisterDriver && (
                                        <RegisterDriverCopyContainer
                                            selectedVehicleType={selectedVehicleType}
                                            vehicleTypes={vehicleTypes}
                                            onSuccess={() => {
                                                setShowRegisterDriver(false);
                                                fetchDrivers();
                                                // re-fetch your drivers here so the new one shows up:
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Show Detailed UI
                            <div className="switchcontainer2" style={{ width: "50%" }}>

                                {/* second vehicel info section with a table */}
                                {!showDetailedUI ? (
                                    <div className="switch-vehicle-container1">
                                        <div className="vehicle-switch-container">

                                            {/* vehicles info section */}
                                            <div className="vehicle-info">
                                                {/* vehicles info*/}
                                                <div className="align-container">
                                                    <div className="info-img">
                                                        <img
                                                            src={selectedVehicleType?.picture}
                                                            alt={selectedVehicleType?.typeName}
                                                            style={infoImgStyles[selectedVehicleType?.typeName.replace(/\s/g, '')]}
                                                        />
                                                    </div>
                                                    <div className="info-item-name">
                                                        {selectedVehicleType?.typeName}
                                                    </div>
                                                    <div className="info-item">
                                                        Total weight :{" "}
                                                        <div className="item-count">
                                                            {selectedVehicleType?.totalWeightCapacity}
                                                        </div>
                                                    </div>
                                                    <div className="info-item">
                                                        Capacity box or crate :{" "}
                                                        <div className="item-count">
                                                            {selectedVehicleType?.boxCapacity}
                                                        </div>
                                                    </div>
                                                    <div className="info-item-rate">
                                                        Rate per Km :{" "}
                                                        <div className="item-count">
                                                            {selectedVehicleType?.ratePerKM}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* vehicles info update button */}
                                                <div className="button-div-update">
                                                    <button className="update-button">Update details</button>
                                                </div>


                                                <div className="search-div-holder">
                                                    <SearchBar
                                                        searchQuery={searchQuery}
                                                        setSearchQuery={setSearchQuery}
                                                    />
                                                </div>

                                            </div>

                                            {/* vehicles info table */}
                                            <div className="table-container">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Vehicle Name</th>
                                                            <th>Weight</th>
                                                            <th>Capacity</th>
                                                            <th>Rate per Km</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>{selectedVehicleType?.typeName}</td>
                                                            <td>{selectedVehicleType?.totalWeightCapacity}</td>
                                                            <td>{selectedVehicleType?.boxCapacity}</td>
                                                            <td>{selectedVehicleType?.ratePerKM}</td>
                                                            <td>
                                                                <a
                                                                    href="#0"
                                                                    className="see-more-link"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        // handleSeeMore(driver);
                                                                        setShowDetailedUI(true);
                                                                    }}
                                                                >
                                                                    see more
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : (

                                    // the full driver detail window
                                    <div className="switch-vehicle-container2" style={{ display: "flex", flexDirection: "column" }} >

                                        {/* save, update button */}
                                        <div className="top-buttons-div">
                                            <button className="save-button2" onClick={handleSave}>
                                                Back
                                            </button>
                                            {!editMode ? (
                                                <button
                                                    className="update-button1"
                                                    onClick={() => setEditMode(true)}
                                                >
                                                    Update
                                                </button>
                                            ) : (
                                                <button className="save-button1" onClick={handleSave}>
                                                    Save
                                                </button>
                                            )}
                                        </div>

                                        {/* top section with the img and the personal info */}
                                        <div className="info-container">
                                            {/* top vehicle type icon */}
                                            <div className="icon-top">
                                                <img
                                                    src={selectedVehicleType?.picture}
                                                    alt={selectedVehicleType?.typeName || "Vehicle Type"}
                                                    width="50px"
                                                    height="50px"
                                                />
                                                <div className="imgname">{selectedVehicleType?.typeName}</div>
                                            </div>

                                            {/* full driver personal details section*/}
                                            <div className="top-row-vehicle">

                                                {/* profile img */}
                                                <div className="user-profile-image">
                                                    <img
                                                        src={
                                                            selectedDriver?.profilePhoto
                                                                ? selectedDriver.profilePhoto
                                                                : driverprofimg // fallback image
                                                        }
                                                        width="110px"
                                                        height="110px"
                                                        alt="Driver Profile"
                                                        onError={(e) => {
                                                            e.target.src = driverprofimg; // or some other fallback
                                                        }}
                                                    />
                                                    {/* updating or removing the profil?ePicture */}
                                                    {editMode && (
                                                        <div className="image-buttons">
                                                            {/* upload image btn */}
                                                            <button className="upload-button-image">
                                                                <img
                                                                    className="upload-icon"
                                                                    src={uploaduserprofilebuttonimg}
                                                                    alt="Upload"
                                                                />
                                                                <div className="upload-button-text">Upload</div>
                                                            </button>
                                                            {/* delete image btn */}
                                                            <button className="remove-button-image">
                                                                <img
                                                                    className="remove-icon"
                                                                    src={deleteuserprofileimgbuttonimg}
                                                                    alt="Remove"
                                                                />
                                                                <div className="delete-button-text">Remove</div>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* personal info section */}
                                                <div className="personal-info-card-block">
                                                    {/* title */}
                                                    <div className="info-card-titile">
                                                        <h3>Personal Information</h3>
                                                    </div>
                                                    {/* name */}
                                                    <div className="info-card-detail-row">
                                                        <p>
                                                            <span className="info-label">Name:</span>
                                                            <span className="info-value">
                                                                {selectedDriver?.fullName || "N/A"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    {/* driverId */}
                                                    <div className="info-card-detail-row">
                                                        <p>
                                                            <span className="info-label">Driver ID:</span>
                                                            <span className="info-value">{selectedDriver?.driverId || "N/A"}</span>
                                                        </p>
                                                    </div>
                                                    {/* telephone */}
                                                    <div className="info-card-detail-row">
                                                        <p>
                                                            <span className="info-label">Telephone:</span>
                                                            {/* updaing the telephone */}
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    className="info-value-tp-editable"
                                                                    value={selectedDriver.phoneNumber}
                                                                    onChange={(e) =>
                                                                        setDriverTelephone(e.target.value)
                                                                    }
                                                                />
                                                            ) : (
                                                                <span className="info-value-tp-editable">
                                                                    {selectedDriver.phoneNumber}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    {/* dob */}
                                                    <div className="info-card-detail-row">
                                                        <p>
                                                            <span className="info-label">Date of Birth:</span>
                                                            <span className="info-value">
                                                                {selectedDriver?.dateOfBirth
                                                                    ? new Date(selectedDriver.dateOfBirth).toLocaleDateString("en-GB", {
                                                                        year: "numeric",
                                                                        month: "long",
                                                                        day: "numeric"
                                                                    })
                                                                    : "N/A"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    {/* email */}
                                                    <div className="info-card-detail-row">
                                                        <p>
                                                            <span className="info-label">Email:</span>
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    className="info-value-tp-editable"
                                                                    value={selectedDriver.emailAddress}
                                                                    onChange={(e) =>
                                                                        setDriverEmail(e.target.value)
                                                                    }
                                                                />
                                                            ) : (
                                                                <span className="info-value-tp-editable">
                                                                    {selectedDriver.emailAddress}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    {/* address */}
                                                    <div className="info-card-detail-row">
                                                        <p>
                                                            <span className="info-label">Address:</span>
                                                            <span className="info-value">
                                                                {selectedDriver?.homeAddress || "No Address"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* drivers vehicle info */}
                                                <div className="fleet-info-card-block">
                                                    {/* title */}
                                                    <div className="info-card-titile">
                                                        <h3>Fleet Information</h3>
                                                    </div>
                                                    {/* vehicleId */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">Vehicle Id:</span>
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    className="info-value-editable"
                                                                    value={selectedDriver.vehicleRegNo}
                                                                    onChange={(e) =>
                                                                        setFleetVehicleId(e.target.value)
                                                                    }
                                                                />
                                                            ) : (
                                                                <span className="info-value-editable">
                                                                    {selectedDriver.vehicleRegNo}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    {/* vehicleColor */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">Color:</span>
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    className="info-value-editable"
                                                                    value={selectedDriver.vehicleColor}
                                                                    onChange={(e) => setFleetColor(e.target.value)}
                                                                />
                                                            ) : (
                                                                <span className="info-value-editable">
                                                                    {selectedDriver.vehicleColor}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    {/* LicenseNo */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">Licen Number:</span>
                                                            <span className="info-value">{selectedDriver.licenseNumber}</span>
                                                        </p>
                                                    </div>
                                                    {/* expirationDate */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">Expiration Date:</span>
                                                            {editMode ? (
                                                                <input
                                                                    type="text"
                                                                    className="info-value-editable"
                                                                    value={selectedDriver?.expirationDate
                                                                        ? new Date(selectedDriver.expirationDate).toLocaleDateString("en-GB", {
                                                                            year: "numeric",
                                                                            month: "long",
                                                                            day: "numeric"
                                                                        })
                                                                        : "N/A"}
                                                                    onChange={(e) =>
                                                                        setFleetExpirationDate(e.target.value)
                                                                    }
                                                                />
                                                            ) : (
                                                                <span className="info-value-editable">
                                                                    {selectedDriver?.expirationDate
                                                                        ? new Date(selectedDriver.expirationDate).toLocaleDateString("en-GB", {
                                                                            year: "numeric",
                                                                            month: "long",
                                                                            day: "numeric"
                                                                        })
                                                                        : "N/A"}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    {/* liscenseStatus */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">Licen Status:</span>
                                                            <span className="info-value">
                                                                <div className="licen-status-label">{selectedDriver.licenseStatus}</div>
                                                            </span>
                                                        </p>
                                                    </div>
                                                    {/* assignedStatus */}
                                                    {/* <div className="info-card-detail-row-short">
                            <p>
                              <span className="info-label">Assigned Status:</span>
                              <span className="info-value">
                                <div className="assigned-status-label">Assigned</div>
                              </span>
                            </p>
                          </div> */}
                                                </div>

                                                {/* driver employeement details */}
                                                <div className="employment-info-card-block">
                                                    {/* title */}
                                                    <div className="info-card-titile">
                                                        <h3>Employment Details</h3>
                                                    </div>
                                                    {/* joinedDate */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">Joined Date:</span>
                                                            <span className="info-value">
                                                                {selectedDriver?.hireDate
                                                                    ? new Date(selectedDriver.hireDate).toLocaleDateString("en-GB", {
                                                                        year: "numeric",
                                                                        month: "long",
                                                                        day: "numeric"
                                                                    })
                                                                    : "N/A"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    {/* employeementStatus */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">
                                                                Employement Status:
                                                            </span>
                                                            <span className="info-value-tp">{selectedDriver.employmentStatus}</span>
                                                        </p>
                                                    </div>
                                                    {/* driverType */}
                                                    <div className="info-card-detail-row-short">
                                                        <p>
                                                            <span className="info-label">Driver:</span>
                                                            <span className="info-value-driver">
                                                                {selectedDriver.role}
                                                            </span>
                                                        </p>
                                                    </div>

                                                    <div className="info-card-actions">
                                                        <button type="button" onClick={() => setShowDeleteConfirm(true)}>
                                                            Delete
                                                        </button>
                                                    </div>








                                                    {/* end of employeement details div */}
                                                </div>

                                            </div>
                                        </div>

                                        {/* driver metics section */}
                                        <div className="metrics-container">
                                            {/* title */}
                                            <div className="metrics-heading">
                                                <h3>Metrics Monitoring</h3>
                                            </div>

                                            <div className="metrics-monitoring">
                                                {/* metrics slideBar */}
                                                <div className="metrics-slidebar">
                                                    <div
                                                        className={`metric-slide-labe1 ${activeTab === 1 ? "active" : ""
                                                            }`}
                                                        onClick={() => handleTabClick(1)}
                                                    >
                                                        Recent Trips Overview
                                                    </div>
                                                    <div
                                                        className={`metric-slide-labe2 ${activeTab === 2 ? "active" : ""
                                                            }`}
                                                        onClick={() => handleTabClick(2)}
                                                    >
                                                        Driver Availability
                                                    </div>
                                                    <div
                                                        className={`metric-slide-labe3 ${activeTab === 3 ? "active" : ""
                                                            }`}
                                                        onClick={() => handleTabClick(3)}
                                                    >
                                                        Driver Performance
                                                    </div>
                                                    <div
                                                        className={`metric-slide-labe4 ${activeTab === 4 ? "active" : ""
                                                            }`}
                                                        onClick={() => handleTabClick(4)}
                                                    >
                                                        Current Delivery
                                                    </div>
                                                </div>

                                                {/* metrics types */}
                                                <div className="metrics-content">

                                                    {/* TAB 1: Recent Trips */}

                                                    {/* If you have real data in recentTrips */}
                                                    {recentTrips && recentTrips.length > 0 ? (
                                                        recentTrips.map((trip) => (
                                                            <div className={`metric-slide-labe1-container ${activeTab === 1 ? "active" : ""}`} style={{ marginBottom: "1rem" }}>
                                                                <div className="recent-trip-content" key={trip._id}>
                                                                    {/* top bar */}
                                                                    <div className="recent-trip-content-topbar">
                                                                        <div className="topbar-user-info">
                                                                            <div className="topbar-user-profileimg">
                                                                                <img
                                                                                    src={
                                                                                        selectedDriver?.profilePhoto
                                                                                            ? selectedDriver.profilePhoto
                                                                                            : driverprofimg
                                                                                    }
                                                                                    height="40px"
                                                                                    width="40px"
                                                                                    alt="Driver"
                                                                                    onError={(e) => {
                                                                                        e.target.src = driverprofimg;
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="topbar-user-details">
                                                                                <div className="topbar-user-name">
                                                                                    {selectedDriver?.fullName || "N/A"}
                                                                                </div>
                                                                                <div className="topbar-user-id">
                                                                                    {selectedDriver?.driverId || ""}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="topbar-date-info">
                                                                            <div className="topbar-date-line1">
                                                                                Delivery: {new Date(trip.deliveryDate).toLocaleDateString()}
                                                                            </div>
                                                                            <div className="topbar-date-line2">
                                                                                {trip.distanceTraveled}km .{" "}
                                                                                {trip.tripDuration?.durationInMinutes} minutes
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="recent-trip-content-info-tag">
                                                                        <div className="recent-trip-content-info-tag-text">
                                                                            Latest Delivery Information
                                                                        </div>
                                                                        <div className="recent-trip-content-info-tag-image">
                                                                            <i className="fi fi-rr-info"></i>
                                                                        </div>
                                                                    </div>

                                                                    {/* Data summary */}
                                                                    <div className="recent-trip-content-data">
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Delivery ID</div>
                                                                            <div className="trip-data-sub">{trip._id.substring(0, 5)}${trip._id.length > 5 ? '...' : ''}</div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Distance</div>
                                                                            <div className="trip-data-sub">
                                                                                {trip.distanceTraveled} km
                                                                            </div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Total minutes</div>
                                                                            <div className="trip-data-sub">
                                                                                {trip.tripDuration?.durationInMinutes}
                                                                            </div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Average rating</div>
                                                                            <div className="trip-data-sub">
                                                                                {trip.customer_ratings?.average_rating || "N/A"}
                                                                            </div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Deliverables</div>
                                                                            <div className="trip-data-sub">
                                                                                {trip.noOfOrdersDelivered || 0}
                                                                            </div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Complaints</div>
                                                                            <div className="trip-data-sub">
                                                                                {trip.customer_complaints?.length || 0}
                                                                            </div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Payment</div>
                                                                            <div className="trip-data-sub">{trip.earning || 0}</div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Invoice</div>
                                                                            <div className="trip-data-sub">
                                                                                {trip.invoice ? (
                                                                                    <>
                                                                                        Sent!{" "}
                                                                                        <a href={trip.invoice} target="_blank" rel="noopener noreferrer">
                                                                                            📋
                                                                                        </a>
                                                                                    </>
                                                                                ) : (
                                                                                    "Not Sent"
                                                                                )}

                                                                            </div>
                                                                        </div>
                                                                        <div className="trip-data">
                                                                            <div className="trip-data-heading">Refunded</div>
                                                                            <div className="trip-data-sub">
                                                                                {trip.noOfRefundedOrders || 0}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Complaints, if any */}
                                                                    <div className="recent-trip-content-details">
                                                                        <div className="complaint-full-div">
                                                                            <div className="complaint-table">
                                                                                <div className="complaint-head">
                                                                                    <div className="complaint-head-item">Customer Id</div>
                                                                                    <div className="complaint-head-item">Telephone</div>
                                                                                    <div className="complaint-head-item">Complaint Status</div>
                                                                                    <div className="complaint-head-item wide">Complaint</div>
                                                                                </div>
                                                                                {trip.customer_complaints && trip.customer_complaints.length > 0 ? (
                                                                                    trip.customer_complaints.map((complaint) => (
                                                                                        <div key={complaint.customerId} className="complaint-row">
                                                                                            <div className="complaint-cell">
                                                                                                {complaint.customerId}
                                                                                            </div>
                                                                                            <div className="complaint-cell">
                                                                                                {complaint.customer_phone_no}
                                                                                            </div>
                                                                                            <div className="complaint-cell">
                                                                                                {complaint.complaintStatus}
                                                                                            </div>
                                                                                            <div className="complaint-cell wide">
                                                                                                {complaint.complaint}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <p>No complaints for this trip.</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="no-trips-message">
                                                            <p>No recent trips available for this driver.</p>
                                                        </div>
                                                    )}


                                                    {/* TAB 2: Driver Availability */}
                                                    <div className={`metric-slide-labe2-container ${activeTab === 2 ? "active" : ""}`} >
                                                        {driverAvailability && driverAvailability.length > 0 ? (
                                                            driverAvailability.map((trip) => (
                                                                <div key={trip._id}>

                                                                    <div className="recent-trip-content-topbar" >
                                                                        <div className="topbar-user-info">
                                                                            <div className="topbar-user-profileimg">
                                                                                <img
                                                                                    src={
                                                                                        selectedDriver?.profilePhoto
                                                                                            ? selectedDriver.profilePhoto
                                                                                            : driverprofimg
                                                                                    }
                                                                                    height="40px"
                                                                                    width="40px"
                                                                                    alt="Driver"
                                                                                    onError={(e) => {
                                                                                        e.target.src = driverprofimg;
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="topbar-user-details">
                                                                                <div className="topbar-user-name">
                                                                                    {selectedDriver?.fullName || "N/A"}
                                                                                </div>
                                                                                <div className="topbar-user-id">
                                                                                    {selectedDriver?.driverId || ""}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="recent-trip-content-info-tag">
                                                                        <div className="recent-trip-content-info-tag-text">
                                                                            Latest Driver Schedule Information
                                                                        </div>
                                                                        <div className="recent-trip-content-info-tag-image">
                                                                            <i className="fi fi-rr-info"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="driver-availability-div">
                                                                        {/* availability stats */}
                                                                        <div className="driver-availability-data">
                                                                            <div className="driver-availability-data-icon">
                                                                                <i className="fi fi-rr-calendar"></i>
                                                                            </div>
                                                                            <div className="driver-availability-data-details">
                                                                                <div className="driver-availability-data-head">
                                                                                    Delivery Date
                                                                                </div>
                                                                                <div className="driver-availability-data-body">
                                                                                    {trip.deliveryDate
                                                                                        ? new Date(trip.deliveryDate).toLocaleDateString()
                                                                                        : "N/A"}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Start time */}
                                                                        <div className="driver-availability-data">
                                                                            <div className="driver-availability-data-icon">
                                                                                <i className="fi fi-rr-time-quarter-past"></i>
                                                                            </div>
                                                                            <div className="driver-availability-data-details">
                                                                                <div className="driver-availability-data-head">Start Time</div>
                                                                                <div className="driver-availability-data-body">
                                                                                    {trip.tripDuration?.startTime
                                                                                        ? new Date(trip.tripDuration.startTime).toLocaleTimeString()
                                                                                        : "N/A"}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* End time */}
                                                                        <div className="driver-availability-data">
                                                                            <div className="driver-availability-data-icon">
                                                                                <i className="fi fi-rr-time-quarter-to"></i>
                                                                            </div>
                                                                            <div className="driver-availability-data-details">
                                                                                <div className="driver-availability-data-head">End Time</div>
                                                                                <div className="driver-availability-data-body">
                                                                                    {trip.tripDuration?.endTime
                                                                                        ? new Date(trip.tripDuration.endTime).toLocaleTimeString()
                                                                                        : "N/A"}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Distance */}
                                                                        <div className="driver-availability-data">
                                                                            <div className="driver-availability-data-icon">
                                                                                <i className="fi fi-rr-marker"></i>
                                                                            </div>
                                                                            <div className="driver-availability-data-details">
                                                                                <div className="driver-availability-data-head">
                                                                                    Total Distance
                                                                                </div>
                                                                                <div className="driver-availability-data-body">
                                                                                    {trip.distanceTraveled || 0} km
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Deliverables */}
                                                                        {/* <div className="driver-availability-data">
                                      <div className="driver-availability-data-icon">
                                        <i className="fi fi-rr-box-open"></i>
                                      </div>
                                      <div className="driver-availability-data-details">
                                        <div className="driver-availability-data-head">
                                          Deliverables
                                        </div>
                                        <div className="driver-availability-data-body">
                                          {trip.noOfOrdersDelivered || 0}
                                        </div>
                                      </div>
                                    </div> */}

                                                                        {/* Estimated weight */}
                                                                        {/* <div className="driver-availability-data">
                                      <div className="driver-availability-data-icon">
                                        <i class="fi fi-rr-equality"></i>
                                      </div>
                                      <div className="driver-availability-data-details">
                                        <div className="driver-availability-data-head">
                                          Estimated weight
                                        </div>
                                        <div className="driver-availability-data-body">
                                          {trip.noOfOrdersDelivered || 0}
                                        </div>
                                      </div>
                                    </div> */}

                                                                        {/* Estimated earnings */}
                                                                        {/* <div className="driver-availability-data">
                                      <div className="driver-availability-data-icon">
                                      <i class="fi fi-rr-sack-dollar"></i>
                                      </div>
                                      <div className="driver-availability-data-details">
                                        <div className="driver-availability-data-head">
                                          Estimate earnings
                                        </div>
                                        <div className="driver-availability-data-body">
                                          {trip.noOfOrdersDelivered || 0}
                                        </div>
                                      </div>
                                    </div> */}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="no-availability-message">
                                                                <p>No upcoming trips scheduled for this driver.</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* TAB 3: Driver Performance */}
                                                    <div className={`metric-slide-labe3-container ${activeTab === 3 ? "active" : ""}`} >
                                                        {driverPerformance ? (
                                                            <div>
                                                                <div className="recent-trip-content-topbar">
                                                                    <div className="topbar-user-info">
                                                                        <div className="topbar-user-profileimg">
                                                                            <img
                                                                                src={
                                                                                    selectedDriver?.profilePhoto
                                                                                        ? selectedDriver.profilePhoto
                                                                                        : driverprofimg
                                                                                }
                                                                                height="40px"
                                                                                width="40px"
                                                                                alt="Driver"
                                                                                onError={(e) => {
                                                                                    e.target.src = driverprofimg;
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="topbar-user-details">
                                                                            <div className="topbar-user-name">
                                                                                {selectedDriver?.fullName || "N/A"}
                                                                            </div>
                                                                            <div className="topbar-user-id">
                                                                                {selectedDriver?.driverId || ""}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="recent-trip-content-info-tag">
                                                                    <div className="recent-trip-content-info-tag-text">
                                                                        Latest Delivery Information
                                                                    </div>
                                                                    <div className="recent-trip-content-info-tag-image">
                                                                        <i className="fi fi-rr-info"></i>
                                                                    </div>
                                                                </div>

                                                                <div className="driver-performance-div">
                                                                    {/* performance table */}
                                                                    <table className="driver-performance-table">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Distance traveled
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.totalDistanceTraveled} km
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Customer average rating
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.customerAvgRating}
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Total returned Items
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.totalRefundedOrders}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Total minutes
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.totalTimeSpent}
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Total deliverable items
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.totalOrdersDelivered}
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Average earnings
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.averageEarning}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Total customer complaints
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.totalCustomerComplaints}
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Shopowner average rating
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-detail">
                                                                                        {driverPerformance.shopOwnerAvgRating}
                                                                                    </div>
                                                                                </td>
                                                                                <td>
                                                                                    <div className="driver-performance-div-data-info-head">
                                                                                        Recommendation Status
                                                                                    </div>
                                                                                    <div className="driver-performance-div-data-info-block">
                                                                                        {driverPerformance.recommend_status}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>

                                                                    {/* performance chart */}
                                                                    <div className="driver-performance-div-graph">
                                                                        <PerformanceChart data={driverPerformance.ratingsChartData} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="no-availability-message">
                                                                <p>No performance data available.</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* TAB 4: Current Delivery */}
                                                    <div className={`metric-slide-labe4-container ${activeTab === 4 ? "active" : ""}`} >
                                                        {/* If you have a `currentDelivery` object or array... */}
                                                        {currentDelivery ? (
                                                            <div className="recent-trip-content-topbar">
                                                                <div className="topbar-user-info">
                                                                    <div className="topbar-user-profileimg">
                                                                        <img
                                                                            src={
                                                                                selectedDriver?.profilePhoto
                                                                                    ? selectedDriver.profilePhoto
                                                                                    : driverprofimg
                                                                            }
                                                                            height="40px"
                                                                            width="40px"
                                                                            alt="Driver"
                                                                            onError={(e) => {
                                                                                e.target.src = driverprofimg;
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="topbar-user-details">
                                                                        <div className="topbar-user-name">
                                                                            {selectedDriver?.fullName || "N/A"}
                                                                        </div>
                                                                        <div className="topbar-user-id">
                                                                            {selectedDriver?.driverId || ""}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="topbar-date-info">
                                                                    <div className="topbar-date-line1">
                                                                        Delivery: {new Date(currentDelivery.deliveryDate).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="topbar-date-line2">
                                                                        {currentDelivery.distanceTraveled} km . {currentDelivery.tripDuration?.durationInMinutes} minutes
                                                                    </div>
                                                                </div>

                                                                <div className="recent-trip-content-info-tag">
                                                                    <div className="recent-trip-content-info-tag-text">
                                                                        Latest Delivery Information
                                                                    </div>
                                                                    <div className="recent-trip-content-info-tag-image">
                                                                        <i className="fi fi-rr-info"></i>
                                                                    </div>
                                                                </div>
                                                                {/* Display any other relevant fields from `currentDelivery` */}
                                                            </div>
                                                        ) : (
                                                            <div className="recent-trip-content-info-tag-text">
                                                                No current delivery in progress.
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Product;
