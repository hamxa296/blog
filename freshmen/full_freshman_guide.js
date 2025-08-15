const { useState, useEffect, useMemo } = React;
const { initializeApp } = firebase;
const { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } = firebase.auth;
const { getFirestore, doc, setDoc, onSnapshot, collection, query } = firebase.firestore;

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Hardcoded societies and teams data to be used if Firestore is empty.
const societiesData = {
  academic: {
    title: "🎯 Academic & Technical Societies",
    societies: [
      { name: "ACM (Association for Computing Machinery)", description: "Focuses on programming, software development, and CS-related competitions, workshops, and hackathons." },
      { name: "AIAA (American Institute of Aeronautics and Astronautics)", description: "An aerospace-focused society supporting projects like UAV design and participation in the Design/Build/Fly competition." },
      { name: "IEEE (Institute of Electrical and Electronics Engineers)", description: "Covers electronics, robotics, embedded systems, and electrical innovation through events and hands-on projects." },
      { name: "GMS (GIKI Mathematics Society)", description: "Promotes analytical thinking and math literacy through competitions, puzzles, and problem-solving events." },
      { name: "NETRONiX", description: "GIKI's network and gaming society; manages campus LAN infrastructure and organizes e-sports and tech events like Über.GameX." },
      { name: "Science Society (GIKI Science Society)", description: "Encourages scientific research and experimentation through exhibitions, science fairs, and DIY projects." },
    ]
  },
  cultural: {
    title: "🎭 Cultural, Media & Literary Societies",
    societies: [
      { name: "Naqsh (Naqsh Arts Society)", description: "Promotes visual arts, including painting, calligraphy, and sketching, while celebrating cultural expression." },
      { name: "LDS (Literary and Debating Society)", description: "GIKI’s official platform for debates, MUNs, declamations, and creative writing competitions." },
      { name: "Media Club", description: "Handles photography, videography, and media coverage of campus events; creates multimedia content for the student body." },
      { name: "CDeS (Comedy and Dramatics Entertainment Society)", description: "Performs comedy skits, plays, and theatre productions; GIKI’s center for dramatics and stage acting." },
    ]
  },
  social: {
    title: "📢 Social Impact & Professional Development Societies",
    societies: [
      { name: "SOPHEP (Society for the Promotion of Higher Education in Pakistan)", description: "Offers career counseling, professional development, and alumni networking opportunities." },
      { name: "LES (Leadership and Entrepreneurship Society)", description: "Promotes entrepreneurial thinking and leadership through startup competitions, business simulations, and guest talks." },
      { name: "Project Topi", description: "GIKI’s community outreach initiative that supports education, health, and welfare programs in the local Topi area." },
    ]
  },
  teams: {
    title: "🚀 GIKI Competitive & Engineering Teams",
    societies: [
      { name: "Team Invictus (AIAA)", description: "Designs, builds, and flies remote-controlled aircraft for the AIAA Design/Build/Fly competition in the U.S. Represents GIKI internationally in aerospace design." },
      { name: "Team Foxtrot (Independent)", description: "Builds fully autonomous UAVs for global competitions like the IMechE UAS Challenge. Focuses on drone engineering, embedded systems, and AI-based navigation." },
      { name: "Team Infinity (Formula Student / Mechanical Engineering)", description: "GIKI’s Formula SAE team that designs and fabricates a formula-style electric race car for international motorsport engineering contests like FSUK." },
      { name: "Team Urban (Shell Eco-marathon)", description: "Develops ultra energy-efficient urban concept vehicles. Competes in Shell Eco-marathon Asia and Pakistan, focusing on innovation in sustainable transport." },
      { name: "Team Hammerhead (Shell Eco-marathon)", description: "Specializes in electric prototype vehicles for Shell Eco-marathon. Focuses on lightweight design, battery optimization, and aerodynamic performance." },
      { name: "Team Swift (Independent)", description: "An engineering design team dedicated to building performance drones and UAVs, participating in aerial tech competitions and advancing drone innovation on campus." },
    ]
  }
};

// Placeholder data for the guide sections. This will be used to populate the Firestore
// database if it's empty, ensuring the app has content on first run.
const guidePlaceholderData = [
  {
    id: "important-contacts",
    tag: "Important Contacts",
    shortDescription: "Key people and departments to know on campus.",
    fullContent: [
        { contact: "Hostel Warden", department: "Hostel Administration", purpose: "Primary contact for all hostel-related issues." },
        { contact: "Class Representatives (CRs)", department: "Student Body", purpose: "Reach out for academic matters and class-related issues." },
        { contact: "IT Cell", department: "Information Technology", purpose: "For network, internet, and technical issues on campus." },
        { contact: "Health Center", department: "Medical Services", purpose: "Available for medical emergencies and health consultations." },
        { contact: "Transport Help", department: "Transport Office", purpose: "Assistance with campus transport and bus services." }
    ],
    faqs: [
      { question: "Where is the Health Center located?", answer: "The Health Center is located near the main administration building." },
      { question: "How do I contact my CR?", answer: "Your CRs will be introduced in the first few days of orientation. You will have a class group chat where you can contact them." }
    ],
    warnings: [
      "Do not hesitate to reach out for help. The GIKI administration and student body are there to support you."
    ]
  },
  {
    id: "what-to-pack",
    tag: "What to Pack",
    shortDescription: "Essential things to bring for your hostel stay.",
    fullContent: `For a comfortable stay in your dorm, be sure to bring essential items:
- Bed sheets, a pillow, and a blanket.
- A desk lamp.
- A plug extension is crucial as outlets can be limited.
- Your toiletries and a towel.
- Comfortable shoes (you'll be surprised how much you have to walk here).
- Casual clothes for daily wear and one or two formal outfits for events.`,
    faqs: [
      { question: "Can I bring an electric kettle?", answer: "Yes, electric kettles are generally allowed in the hostels, but check with your hostel warden for any specific restrictions." },
      { question: "Should I bring a locker?", answer: "You will be provided with a cupboard for your belongings. A padlock is highly recommended for security." }
    ],
    warnings: [
      "Avoid overpacking unnecessary items. Space is limited in the dorm rooms."
    ]
  },
  {
    id: "dorm-room-info",
    tag: "Dorm & Room Info",
    shortDescription: "Everything you need to know about your new room.",
    fullContent: "Rooms are allotted by the administration during your orientation week. You will be assigned a roommate and a dorm. Each room comes with basic furniture including a bed, a study table, and a cupboard. Hostel culture is a big part of GIKI life, and respecting your roommate and neighbors is key to a great experience.",
    faqs: [
      { question: "Can I change my room or roommate?", answer: "Room and roommate changes are subject to approval from the hostel administration and are typically only considered in special circumstances." },
      { question: "What is the hostel mess like?", answer: "Each hostel has its own mess, providing a convenient and communal dining experience." }
    ],
    warnings: [
      "Respect your roommate's personal space and belongings. Communication is key to a healthy living environment."
    ]
  },
  {
    id: "weekend-travel",
    tag: "Weekend Travel",
    shortDescription: "How to go home and travel from GIKI.",
    fullContent: `GIKI is located a bit away from major cities, so planning your weekend travel is important. There are GIKI-sponsored buses that run to Rawalpindi/Islamabad, Peshawar, and Abbottabad every Friday and return on Sunday. You can also find ride-sharing options with seniors or other students via hostel or batch group chats — a common and convenient carpooling system.

All those who wish to avail the shuttle service should note the following:

Ticket Booking: Tickets become available every Thursday at the transport office located behind the laundry shop.
Payment: Only cash is accepted.
Rs. 350 for Islamabad, Rawalpindi, and Peshawar
Rs. 400 for Abbottabad
Tip: Get in line early — the queue can get long and seats are limited!

Shuttle Schedule (Every Friday, 4:00 PM Departure from GIKI)
To Rawalpindi/Islamabad

Departure Point: GH / Hostel-9
Arrival Point: Road Master Adda / G-9/4, Peshawar Morr
To Peshawar

Departure Point: GH / Hostel-9
Arrival Point: Bagh-e-Naran, Hayatabad
To Abbottabad

Departure Point: GH / Hostel-9
Arrival Point: GO Petroleum Filling Station`,
    faqs: [
      { question: "Can I book shuttle tickets online?", answer: "No, shuttle tickets are only available in person at the transport office behind the laundry shop. Make sure to bring cash as digital payments are not accepted." },
      { question: "What happens if I miss the shuttle?", answer: "If you miss the shuttle, your best bet is to arrange a ride-share with other students. Many carpools are coordinated through hostel WhatsApp groups or batch chats, especially on weekends." },
      { question: "Are there any travel restrictions for hostel students?", answer: "Yes. All students must inform their warden and sign the departure register before leaving campus. For female students, it's mandatory to get a gate pass signed by their warden before exiting GIKI premises." }
    ],
    warnings: [
      "Always travel in groups, especially at night, and avoid unofficial transport services."
    ]
  },
  {
    id: "mess-and-food",
    tag: "Mess & Food",
    shortDescription: "Everything you need to know about food on campus.",
    fullContent: `GIKI has a central mess system that caters to all students. Additionally, there are several other tuck shops and cafes on campus for when you want a change of pace.

Student Mess Halls
There are designated mess halls for each hostel. The food is served at specific times, and the menu is a mix of Pakistani cuisines, rotating on a weekly basis.
- Breakfast: 7:00 AM - 9:00 AM
- Lunch: 12:30 PM - 2:30 PM
- Dinner: 7:30 PM - 9:30 PM

Other Eateries on Campus
For snacks, late-night cravings, or just a different taste, you can explore:
- Hot and Spicy: Located at TUC. By far the best fast food you can find in GIKI.
- Ayan and Raju for Desi: Also located at TUC. These restaurants offer a wide variety of Pakistani cuisine and fast food, but they lack the feel (the hygiene and taste).
- GIKI Cafe: Owned and run by GIKI admin. It’s located under the auditorium (yes, that circular building you see almost everywhere). It's somewhat similar to the mess in terms of taste and hygiene. It's good for tea and some light snacks like nuggets, samosas, or rolls. You can also come for dinner here—it's cheaper than the mess, so if you want to save, Cafe is the cheapest option you’ve got :)`,
    faqs: [
      { question: "Can I bring my own food to the mess?", answer: "No, outside food is not permitted in the mess hall." },
      { question: "Are there vegetarian options?", answer: "The mess menu usually includes vegetarian dishes, but you can always request a special meal if needed." },
      { question: "Can I opt out of the mess?", answer: "Yes, you can opt-out of the mess on a daily basis (before 2 PM) if you prefer, but it's generally a convenient option." }
    ],
    warnings: [
      "Do not forget to 'mess in' or 'mess out' on time to avoid being charged for meals you won't eat."
    ]
  },
  {
    id: "societies-events",
    tag: "Societies & Events",
    shortDescription: "A peek into GIKI's vibrant student life.",
    fullContent: societiesData,
    faqs: [
      { question: "How can I join a society?", answer: "Most societies have a recruitment drive or 'society fair' at the beginning of the semester where you can sign up." },
      { question: "What is Orientation Week?", answer: "A week-long event filled with introductory sessions, tours, and fun activities to help you settle into GIKI life." }
    ],
    warnings: [
      "Avoid getting overly involved in too many societies in your first year. It's easy to get overwhelmed."
    ]
  },
  {
    id: "survival-tips",
    tag: "Survival Tips",
    shortDescription: "In-depth advice on academics, homesickness, and essential apps.",
    fullContent: `Managing your first year at GIKI can be challenging but also incredibly rewarding. Learn to balance fun and academics from the start. Don't be afraid to ask seniors for help; they have been through it all.

Academics and Stress Management
GIKI's academic environment is demanding. Stay on top of your coursework from the beginning, attend all classes and labs, and form study groups with your peers. Time management is a key skill to develop. Take breaks, go for a walk, or participate in a sports activity to relieve stress.

Dealing with Homesickness
Homesickness is a normal feeling for many freshmen. Getting involved in societies, sports, or other campus activities can help you feel more at home. Regular video calls with family and friends can also help. Don't be afraid to talk to your Resident Advisor (RA) or a senior student about how you feel.

Essential Apps for a GIKI Student
- GIKI Portal App: Official app for checking grades, attendance, and fee details.
- Microsoft Teams: Used for online classes and communication with faculty and classmates.
- WhatsApp: Primary platform for hostel and class group chats.
- Google Drive/Docs: Essential for collaborative projects and saving notes.`,
    faqs: [],
    warnings: [
      "Don't isolate yourself in your room. Step out, meet people, and explore the campus to make the most of your time here."
    ]
  },
  {
    id: "library",
    tag: "Library",
    shortDescription: "All you need to know about GIKI's library.",
    fullContent: `GIKI's main library is the intellectual heart of the campus, offering a wide range of academic resources to support your studies and research. The library houses an extensive collection of books, journals, and digital databases. It's also an excellent place for quiet study and group work.

Services & Resources
- Book borrowing: Students can borrow books for a specified period.
- Digital resources: Access to online journals, e-books, and research databases.
- Study spaces: Designated quiet zones for individual study and collaborative spaces for group projects.
- Printing & scanning: Facilities are available for printing, scanning, and photocopying documents.

Opening Hours
- Monday to Friday: 9:00 AM to 10:00 PM
- Saturday: 9:00 AM to 5:00 PM
- Sunday: Closed`,
    faqs: [
      { question: "How do I get a library card?", answer: "Your student ID card doubles as your library card. You just need to register it at the library front desk." },
      { question: "Is there a fine for late returns?", answer: "Yes, fines are charged for books returned past their due date. Check with the library staff for the current fee structure." }
    ],
    warnings: [
      "Keep your phone on silent mode inside the library's quiet zones.",
      "Do not bring food or drinks into the library's reading areas."
    ]
  },
  {
    id: "facilities",
    tag: "Facilities",
    shortDescription: "A brief overview of campus facilities and services.",
    fullContent: `GIKI offers a range of modern facilities to support a well-rounded student experience. The campus is home to a dedicated sports complex with indoor and outdoor courts for various sports like badminton, squash, and basketball. Academic life is supported by state-of-the-art computer labs, specialized departmental labs, and a fully-equipped main library.

For your health and well-being, the campus has a health center with on-call doctors and nurses for medical emergencies and consultations. The main auditorium hosts a variety of academic and social events throughout the year. Additionally, the Student Activity Centre (SAC) serves as a hub for student societies and extracurricular activities.`,
    faqs: [
      { question: "Are the computer labs open 24/7?", answer: "Most computer labs are open until late at night, and some are accessible 24/7, especially during exam periods." },
      { question: "Can I use the sports facilities at any time?", answer: "The sports complex has specific hours of operation. Check the schedule posted at the complex for details." }
    ],
    warnings: [
      "Always follow the rules and regulations of each facility to ensure a safe and pleasant environment for everyone."
    ]
  },
  {
    id: "finances",
    tag: "Finances & Budgeting",
    shortDescription: "Managing your monthly finances as a freshman.",
    fullContent: `## Managing Your Monthly Finances

Budgeting is a key skill to learn at university. Here’s a rough estimate of common monthly expenses to help you plan:

### Estimated Monthly Expenses
-   **Mess Bill (if opted-in):** Rs. 12,000 – 15,000
-   **Laundry Services:** Rs. 1,500 – 2,500
-   **Snacks & Eating Out:** Rs. 3,000 – 5,000
-   **Photocopying & Printing:** Rs. 500 – 1,000
-   **Miscellaneous (toiletries, etc.):** Rs. 2,000 – 4,000

**💰 Estimated Total:** Rs. 19,000 – 27,500

> Note: These are estimates and may vary based on your spending habits.

---

### Additional Financial Tips
-   **Bank Accounts:** Open a student bank account for easier money management and online transactions.
-   **Budgeting:** Track your daily expenses and set a monthly limit to avoid unnecessary overspending.
-   **Mobile Payments:** Apps like Easypaisa, JazzCash, and NayaPay are widely accepted on campus for snacks, food, and essentials.
-   **ATM Locations:** There are two HBL ATMs available on campus for cash withdrawals.
-   **Banking Services:** GIKI has an HBL branch on campus for student banking needs.`,
    faqs: [
      { question: "Are there any banks on campus?", answer: "Yes, there's a full HBL branch and two ATMs for students." },
      { question: "How do I pay my hostel or mess dues?", answer: "You can pay via bank transfer or by visiting the Accounts Office on campus." }
    ],
    warnings: [
      "Avoid carrying large amounts of cash; use digital payments whenever possible.",
      "Be alert to scams—only use official banking apps and verified payment methods.",
    ],
  },
  {
    id: "campus-map",
    tag: "Campus Map",
    shortDescription: "Navigate GIKI with ease using the campus map.",
    fullContent: `<div id="campus-map" style="height: 500px;"></div>`, // Placeholder for the map container
    faqs: [],
    warnings: [],

  },
];

// Add your guide data here

// Example structure:
// {
//   tag: 'Tag Name',
//   fullContent: 'Full content of the section'
// }

// Initialize Leaflet map after the DOM is ready and the map container is present
window.addEventListener('DOMContentLoaded', (event) => {
  const mapContainer = document.getElementById('mapid');
  if (mapContainer) {
    // Your Leaflet map initialization code will go here
  }
});







































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































 to the existing path.
    ]
  }
];


// Helper function to update a doc in Firestore
const updateGuideSection = async (db, sectionId, newData) => {
  try {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'freshmanGuide', sectionId);
    await setDoc(docRef, newData, { merge: true });
    console.log("Document successfully updated!");
  } catch (e) {
    console.error("Error updating document: ", e);
  }
};

const Divider = () => (
  <div className="flex items-center my-8">
    <div className="flex-grow h-px bg-gray-300"></div>
    <div className="mx-4 h-3 w-3 bg-gray-400 rounded-full"></div>
    <div className="flex-grow h-px bg-gray-300"></div>
  </div>
);

const App = () => {
  const [db, setDb] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [guideSections, setGuideSections] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);

  // State for editing a section
  const [editingSection, setEditingSection] = useState(null);
  const [editForm, setEditForm] = useState({
    tag: '',
    shortDescription: '',
    fullContent: '',
    faqs: [],
    warnings: [],
  });

  // State for societies sub-navigation
  const [selectedSocietySubTag, setSelectedSocietySubTag] = useState(null);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const auth = getAuth(app);
        setDb(firestore);

        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }

        onAuthStateChanged(auth, (user) => {
          if (user) {
            setIsAuthReady(true);
            console.log("User signed in:", user.uid);

            const freshmanGuideRef = collection(firestore, 'artifacts', appId, 'public', 'data', 'freshmanGuide');
            const q = query(freshmanGuideRef);

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
              const fetchedData = [];
              if (querySnapshot.empty) {
                  console.log("No data found, using placeholder data.");
                  // Use a map to ensure all placeholders are processed and then set the state once
                  const promises = guidePlaceholderData.map(async (data) => {
                      const docRef = doc(firestore, 'artifacts', appId, 'public', 'data', 'freshmanGuide', data.id);
                      await setDoc(docRef, data);
                      console.log(`Document for ${data.tag} created with ID: ${data.id}`);
                      return data;
                  });
                  Promise.all(promises).then((data) => {
                      setGuideSections(data);
                  });
              } else {
                  querySnapshot.forEach((doc) => {
                      fetchedData.push({ id: doc.id, ...doc.data() });
                  });
                  console.log("Fetched data:", fetchedData);
                  setGuideSections(fetchedData);
              }
            });

            return () => unsubscribe();
          } else {
            setIsAuthReady(true);
            console.log("User is signed out or anonymous.");
          }
        });
      } catch (e) {
        console.error("Error initializing Firebase or fetching data: ", e);
      }
    };

    initFirebase();
  }, []);

  const handleTagClick = (sectionId) => {
    setExpandedSection(sectionId);
    setSelectedSocietySubTag(null); // Reset sub-tag selection when a new main tag is clicked
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBackClick = () => {
    setExpandedSection(null);
    setSelectedSocietySubTag(null); // Reset sub-tag selection when returning to the main page
  };

  const handleEditClick = (sectionId) => {
    const currentData = guideSections.find(s => s.id === sectionId);
    if (currentData) {
      setEditingSection(sectionId);
      // Serialize complex objects for the textarea
      const content = typeof currentData.fullContent === 'string'
        ? currentData.fullContent
        : JSON.stringify(currentData.fullContent, null, 2);

      setEditForm({
        tag: currentData.tag,
        shortDescription: currentData.shortDescription,
        fullContent: content,
        faqs: currentData.faqs || [],
        warnings: currentData.warnings || [],
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSection || !db) return;

    let updatedContent = editForm.fullContent;
    try {
      if (editingSection === 'important-contacts' || editingSection === 'societies-events') {
        updatedContent = JSON.parse(editForm.fullContent);
      }
    } catch (e) {
      // Use a custom modal or message box instead of alert()
      console.error('Invalid JSON format for this section:', e);
      return;
    }

    const newData = {
      tag: editForm.tag,
      shortDescription: editForm.shortDescription,
      fullContent: updatedContent,
      faqs: editForm.faqs,
      warnings: editForm.warnings,
    };

    await updateGuideSection(db, editingSection, newData);
    setEditingSection(null);
  };

  const handleCloseModal = () => {
    setEditingSection(null);
  };

  // Handlers for the form inputs
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...editForm.faqs];
    newFaqs[index][field] = value;
    setEditForm(prev => ({ ...prev, faqs: newFaqs }));
  };

  const handleAddFaq = () => {
    setEditForm(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }));
  };

  const handleRemoveFaq = (index) => {
    const newFaqs = editForm.faqs.filter((_, i) => i !== index);
    setEditForm(prev => ({ ...prev, faqs: newFaqs }));
  };

  const handleWarningChange = (index, value) => {
    const newWarnings = [...editForm.warnings];
    newWarnings[index] = value;
    setEditForm(prev => ({ ...prev, warnings: newWarnings }));
  };

  const handleAddWarning = () => {
    setEditForm(prev => ({ ...prev, warnings: [...prev.warnings, ''] }));
  };

  const handleRemoveWarning = (index) => {
    const newWarnings = editForm.warnings.filter((_, i) => i !== index);
    setEditForm(prev => ({ ...prev, warnings: newWarnings }));
  };

  const societySubCategories = useMemo(() => {
    return guideSections.find(s => s.id === 'societies-events')?.fullContent;
  }, [guideSections]);

  return (
    <div className="bg-[#f0f2f5] min-h-screen font-inter text-[#2A2A2A] p-4 sm:p-8">
      {/* New horizontal header box */}
      <div className="bg-gradient-to-r from-[#8C1D40] to-[#1a936f] text-white p-6 sm:p-8 mb-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl sm:text-4xl font-bold font-lora">GIKI Freshman Guide</h1>
        <p className="mt-2 text-lg text-gray-200">Your ultimate resource for a smooth start at GIKI.</p>
      </div>

      {/* Main container with a centered, rounded card */}
      <div className="max-w-5xl mx-auto chronicle-container bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-200">

        {/* New welcome message section */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold font-lora text-[#8C1D40]">Welcome to GIKI!</h2>
          <p className="mt-4 text-lg text-gray-700 max-w-2xl mx-auto">
            Welcome to your new home! This guide is designed to help you navigate your first few weeks here. We've compiled essential information, tips, and resources to make your transition as smooth as possible.
          </p>
        </div>

        <main>
          {/* Tags Grid (Only visible when no section is expanded) */}
          {expandedSection === null && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {guideSections.length > 0 ? (
                guideSections.map(section => (
                  <div
                    key={section.id}
                    className={`p-6 bg-white rounded-xl cursor-pointer shadow-md transition-all duration-300 ease-in-out transform
                      hover:scale-105 hover:shadow-lg`}
                    onClick={() => handleTagClick(section.id)}
                    title={section.shortDescription}
                  >
                    <h3 className={`text-xl font-semibold font-lora text-[#1a936f]`}>
                      {section.tag}
                    </h3>
                    <p className={`mt-2 text-sm text-gray-600`}>
                      {section.shortDescription}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-500">
                  <p>Loading guide data or creating initial documents...</p>
                </div>
              )}
            </div>
          )}

          {/* Expanded Content Section with animation */}
          {guideSections.map(section => (
            <div key={section.id}>
              {expandedSection === section.id && (
                <div
                  id={section.id}
                  className={`mt-12 p-8 bg-white rounded-xl shadow-inner border border-gray-200 transition-all duration-500 ease-in-out`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-3xl font-bold font-lora text-[#1a936f]">{section.tag}</h2>
                      <button
                        onClick={() => handleEditClick(section.id)}
                        className="bg-[#1a936f] text-white px-4 py-2 rounded-lg hover:bg-[#156e52] transition-colors shadow-md"
                      >
                        Edit
                      </button>
                  </div>

                  {/* Conditional rendering for societies content */}
                  {section.id === "societies-events" && societySubCategories ? (
                    <div className="flex flex-col sm:flex-col gap-6">
                      {/* Sub-tag navigation for societies - now horizontal */}
                      <nav className="flex flex-wrap gap-2 mb-6">
                        {Object.keys(societySubCategories).map((key) => (
                          <button
                            key={key}
                            onClick={() => setSelectedSocietySubTag(key)}
                            className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200
                              ${selectedSocietySubTag === key
                                ? 'bg-[#1a936f] text-white shadow-md'
                                : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                              }`
                            }
                          >
                            <span>{societySubCategories[key].title}</span>
                          </button>
                        ))}
                      </nav>
                      {/* Display content based on selected sub-tag, or a prompt if none is selected */}
                      <div className="sm:flex-grow">
                        {selectedSocietySubTag ? (
                          societySubCategories[selectedSocietySubTag]?.societies?.map((item, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg mb-4 shadow-sm border border-gray-100">
                              <h4 className="text-xl font-semibold text-[#2A2A2A]">{item.name}</h4>
                              <p className="mt-1 text-gray-600 text-sm">{item.description}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-lg">Please select a society category to view the details.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Conditional rendering for structured data, lists, or regular text
                    Array.isArray(section.fullContent) && section.id === "important-contacts" ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left table-auto border-collapse">
                              <thead className="text-gray-700 bg-gray-100">
                                  <tr>
                                      <th className="py-3 px-4 border-b font-semibold">Contact</th>
                                      <th className="py-3 px-4 border-b font-semibold">Department</th>
                                      <th className="py-3 px-4 border-b font-semibold">Purpose</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {section.fullContent.map((item, index) => (
                                      <tr key={index} className="border-b last:border-b-0">
                                          <td className="py-3 px-4 text-[#2A2A2A]">{item.contact}</td>
                                          <td className="py-3 px-4 text-gray-600">{item.department}</td>
                                          <td className="py-3 px-4 text-gray-600">{item.purpose}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                        </div>
                    ) : (
                      // Render list items with standard list-disc
                      section.fullContent && typeof section.fullContent === 'string' && section.fullContent.trim().startsWith('-') ? (
                          <ul className="mt-4 space-y-2 list-disc list-inside">
                              {section.fullContent.split('\n').filter(line => line.trim()).map((line, index) => {
                                  const content = line.trim().startsWith('-') ? line.trim().substring(1).trim() : line;
                                  return content && <li key={index} className="text-gray-700">{content}</li>;
                              })}
                          </ul>
                      ) : (
                          // Render as a regular paragraph
                          <p className="mt-4 text-[#2A2A2A] leading-relaxed whitespace-pre-wrap">{section.fullContent}</p>
                      )
                    )
                  )}

                  {/* Divider added here */}
                  <Divider />

                  {/* FAQ Section - Redesigned with custom borders and background */}
                  {section.faqs && section.faqs.length > 0 && (
                    <div className="mt-8 p-6 rounded-xl bg-gray-100 border border-gray-200">
                      <h3 className="text-2xl font-semibold font-lora text-[#1a936f] border-b-2 pb-2 mb-4 border-gray-200">FAQs</h3>
                      <div className="space-y-4">
                        {section.faqs.map((faq, index) => (
                          <details key={index} className="group cursor-pointer p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
                            <summary className="flex justify-between items-center font-medium list-none">
                              <span className="font-semibold text-gray-700">{faq.question}</span>
                              <span className="transition group-open:rotate-180">
                                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                              </span>
                            </summary>
                            <p className="text-gray-600 mt-2 ml-4">{faq.answer}</p>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings Section - Softer tone and colors */}
                  {section.warnings && section.warnings.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-2xl font-semibold font-lora text-amber-800 border-b-2 pb-2 mb-4 border-gray-200">Helpful reminders</h3>
                      <div className="space-y-4">
                        {section.warnings.map((warning, index) => (
                          <div key={index} className="flex items-start p-4 bg-amber-50 border-l-4 border-amber-300 text-amber-800 rounded-md">
                            <span className="text-2xl mr-3 flex-shrink-0">💡</span>
                            <p>{warning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Back Button (Only visible when a section is expanded) */}
          {expandedSection !== null && (
            <div className="text-center mt-12">
              <button
                onClick={handleBackClick}
                className="bg-[#1a936f] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#156e52] transition-colors shadow-md"
              >
                &larr; Back to all sections
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-2xl font-lora font-bold text-[#8C1D40]">Edit {editForm.tag}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                <input
                  type="text"
                  name="tag"
                  value={editForm.tag}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#1a936f] focus:border-[#1a936f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  name="shortDescription"
                  value={editForm.shortDescription}
                  onChange={handleFormChange}
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#1a936f] focus:border-[#1a936f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Content (
                  {editingSection === 'important-contacts' || editingSection === 'societies-events'
                    ? 'JSON formatted content'
                    : 'Plain Text'
                  })
                </label>
                <textarea
                  name="fullContent"
                  value={editForm.fullContent}
                  onChange={handleFormChange}
                  rows="6"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#1a936f] focus:border-[#1a936f] font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">FAQs</label>
                  <button onClick={handleAddFaq} className="bg-[#1a936f] text-white px-3 py-1 rounded-md text-sm hover:bg-[#156e52] transition-colors shadow-md">
                    Add FAQ
                  </button>
                </div>
                {editForm.faqs.map((faq, index) => (
                  <div key={index} className="flex space-x-2 mb-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <input
                      type="text"
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                    />
                    <button onClick={() => handleRemoveFaq(index)} className="text-red-500 hover:text-red-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.381 21H7.618a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m10 0H4" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Warnings</label>
                  <button onClick={handleAddWarning} className="bg-[#1a936f] text-white px-3 py-1 rounded-md text-sm hover:bg-[#156e52] transition-colors shadow-md">
                    Add Warning
                  </button>
                </div>
                {editForm.warnings.map((warning, index) => (
                  <div key={index} className="flex space-x-2 mb-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <input
                      type="text"
                      placeholder="Warning message"
                      value={warning}
                      onChange={(e) => handleWarningChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                    />
                    <button onClick={() => handleRemoveWarning(index)} className="text-red-500 hover:text-red-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.381 21H7.618a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m10 0H4" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-[#1a936f] hover:bg-[#156e52] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
