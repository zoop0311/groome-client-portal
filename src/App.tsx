import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDZ2epHZaJBNRddmCrxnzrUIV_LvuCPeV0',
  authDomain: 'clientportal-5fe70.firebaseapp.com',
  projectId: 'clientportal-5fe70',
  storageBucket: 'clientportal-5fe70.firebasestorage.app',
  messagingSenderId: '668500899292',
  appId: '1:668500899292:web:7dcc9599800a2748d18b19',
  measurementId: 'G-G83RZDE6VX',
};

// Initialize Firebase and its services
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Context for Firebase and User
const FirebaseContext = createContext(null);

// Custom Message Box Component
const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor =
    type === 'error'
      ? 'bg-red-100 border-red-400 text-red-700'
      : 'bg-green-100 border-green-400 text-green-700';
  const borderColor = type === 'error' ? 'border-red-500' : 'border-green-500';

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center justify-between z-50 ${bgColor} border-l-4 ${borderColor}`}
    >
      <p className="font-semibold">{message}</p>
      <button
        onClick={onClose}
        className="ml-4 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
  </div>
);

// Main App Component
const App = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [messageBox, setMessageBox] = useState({ message: '', type: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        const initialAuthToken =
          typeof __initial_auth_token !== 'undefined'
            ? __initial_auth_token
            : null;
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error('Firebase authentication error:', error);
          setMessageBox({
            message: `Authentication failed: ${error.message}`,
            type: 'error',
          });
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const showMessage = (message, type = 'success') => {
    setMessageBox({ message, type });
    setTimeout(() => setMessageBox({ message: '', type: '' }), 5000);
  };

  if (!isAuthReady) {
    return <LoadingSpinner />;
  }

  if (!db || !auth) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800 flex flex-col items-center justify-center p-4">
        <MessageBox
          message={
            messageBox.message ||
            'Application failed to load due to a configuration error.'
          }
          type="error"
          onClose={() => setMessageBox({ message: '', type: '' })}
        />
        <p className="text-xl text-red-700 text-center mt-4">
          Application initialization failed. Please check the console for
          errors.
        </p>
      </div>
    );
  }

  const contextValue = { db, auth, userId, showMessage };

  const navigateTo = (page, project = null) => {
    setCurrentPage(page);
    setSelectedProject(project);
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-100 font-sans antialiased text-gray-800">
        <MessageBox
          message={messageBox.message}
          type={messageBox.type}
          onClose={() => setMessageBox({ message: '', type: '' })}
        />
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg rounded-b-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Groome Consulting Group Client Portal
            </h1>
            <nav>
              <button
                onClick={() => navigateTo('dashboard')}
                className="px-5 py-2 rounded-full bg-blue-700 hover:bg-blue-900 transition duration-300 ease-in-out shadow-md text-lg font-medium"
              >
                Dashboard
              </button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto p-6 mt-8">
          {currentPage === 'dashboard' && <Dashboard navigateTo={navigateTo} />}
          {currentPage === 'projectDetail' && selectedProject && (
            <ProjectDetail project={selectedProject} navigateTo={navigateTo} />
          )}
          {currentPage === 'accountInfo' && <AccountInfo />}
          {currentPage === 'support' && <Support />}
        </main>

        <footer className="bg-gray-800 text-white p-6 mt-12 rounded-t-lg shadow-inner">
          <div className="container mx-auto text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} Groome Consulting Group. All
              rights reserved.
            </p>
            <p className="mt-2">
              Your User ID:{' '}
              <span className="font-mono text-blue-300 break-all">
                {userId}
              </span>
            </p>
          </div>
        </footer>
      </div>
    </FirebaseContext.Provider>
  );
};

// Dashboard Component
const Dashboard = ({ navigateTo }) => {
  const { db, userId, showMessage } = useContext(FirebaseContext);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!db || !userId) {
      setLoadingProjects(false);
      return;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const projectsCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/projects`
    );
    const unsubscribeProjects = onSnapshot(
      projectsCollectionRef,
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsData);
        setLoadingProjects(false);
      },
      (error) => {
        console.error('Error fetching projects:', error);
        showMessage(`Failed to load projects: ${error.message}`, 'error');
        setLoadingProjects(false);
      }
    );

    return () => {
      unsubscribeProjects();
    };
  }, [db, userId, showMessage]);

  const addMockProjects = async () => {
    setLoadingProjects(true);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const projectsCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/projects`
    );
    try {
      const existingDocs = await getDocs(projectsCollectionRef);

      if (existingDocs.empty) {
        const mockProjects = [
          {
            projectName: 'Operational Efficiency Boost - Phase 1',
            status: 'In Progress',
            packageType: 'Operational Efficiency Boost',
            milestones: [
              { name: 'Initial Meeting', completed: true, date: '2025-07-01' },
              {
                name: 'Process Analysis Report',
                completed: false,
                date: '2025-07-15',
              },
              {
                name: 'Implementation Plan Draft',
                completed: false,
                date: '2025-07-30',
              },
            ],
            deliverables: [
              {
                name: 'Process Analysis and Optimization Report',
                url: 'https://placehold.co/600x400/FF5733/FFFFFF?text=ProcessReport.pdf',
                packageType: 'Operational Efficiency Boost',
              },
              {
                name: 'Implementation Plan',
                url: 'https://placehold.co/600x400/33FF57/FFFFFF?text=ImplementationPlan.pdf',
                packageType: 'Operational Efficiency Boost',
              },
            ],
            documents: [
              {
                name: 'Initial Assessment',
                url: 'https://placehold.co/600x400/3357FF/FFFFFF?text=InitialAssessment.pdf',
              },
              {
                name: 'Project Proposal',
                url: 'https://placehold.co/600x400/FF33A1/FFFFFF?text=ProjectProposal.pdf',
              },
            ],
            communications: [
              {
                sender: 'Consultant',
                message:
                  "Welcome to the portal! We've uploaded the initial assessment.",
                timestamp: new Date().toISOString(),
              },
              {
                sender: 'Client',
                message: 'Thanks! Looking forward to the process analysis.',
                timestamp: new Date().toISOString(),
              },
            ],
          },
          {
            projectName: 'Strategic Growth Accelerator - Market Entry',
            status: 'Completed',
            packageType: 'Strategic Growth Accelerator',
            milestones: [
              { name: 'Vision Workshop', completed: true, date: '2025-06-01' },
              {
                name: 'Market Analysis Complete',
                completed: true,
                date: '2025-06-15',
              },
              {
                name: 'Strategic Plan Document Finalized',
                completed: true,
                date: '2025-06-30',
              },
            ],
            deliverables: [
              {
                name: 'Strategic Plan Document',
                url: 'https://placehold.co/600x400/5733FF/FFFFFF?text=StrategicPlan.pdf',
                packageType: 'Strategic Growth Accelerator',
              },
              {
                name: 'Market Analysis Report',
                url: 'https://placehold.co/600x400/FF3357/FFFFFF?text=MarketAnalysis.pdf',
                packageType: 'Strategic Growth Accelerator',
              },
              {
                name: 'Actionable Growth Initiatives',
                url: 'https://placehold.co/600x400/33FFB5/FFFFFF?text=GrowthInitiatives.pdf',
                packageType: 'Strategic Growth Accelerator',
              },
            ],
            documents: [
              {
                name: 'Competitive Landscape Report',
                url: 'https://placehold.co/600x400/A1FF33/FFFFFF?text=CompetitiveReport.pdf',
              },
            ],
            communications: [
              {
                sender: 'Consultant',
                message: 'The strategic plan is finalized and uploaded.',
                timestamp: new Date().toISOString(),
              },
              {
                sender: 'Client',
                message:
                  "Excellent work! We're excited to implement these initiatives.",
                timestamp: new Date().toISOString(),
              },
            ],
          },
          {
            projectName: 'Digital Transformation Essentials - Audit Phase',
            status: 'Pending',
            packageType: 'Digital Transformation Essentials',
            milestones: [
              {
                name: 'Digital Audit Scheduled',
                completed: false,
                date: '2025-08-01',
              },
              {
                name: 'Survey & Workshop Complete',
                completed: false,
                date: '2025-08-15',
              },
            ],
            deliverables: [
              {
                name: 'Digital Audit, Survey, & Workshop Report',
                url: 'https://placehold.co/600x400/FFC300/FFFFFF?text=DigitalAuditReport.pdf',
                packageType: 'Digital Transformation Essentials',
              },
              {
                name: 'Digital Strategy Roadmap',
                url: 'https://placehold.co/600x400/DAF7A6/FFFFFF?text=DigitalRoadmap.pdf',
                packageType: 'Digital Transformation Essentials',
              },
            ],
            documents: [
              {
                name: 'Client Onboarding Form',
                url: 'https://placehold.co/600x400/C70039/FFFFFF?text=OnboardingForm.pdf',
              },
            ],
            communications: [
              {
                sender: 'Consultant',
                message:
                  "We're ready to kick off your digital audit next week!",
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ];

        for (const project of mockProjects) {
          await addDoc(projectsCollectionRef, project);
        }
        showMessage('Mock projects added successfully!', 'success');
      } else {
        showMessage('Projects already exist. Not adding mock data.', 'info');
      }
    } catch (error) {
      console.error('Error adding mock projects:', error);
      showMessage(`Failed to add mock projects: ${error.message}`, 'error');
    } finally {
      setLoadingProjects(false);
    }
  };

  if (loadingProjects) {
    return <LoadingSpinner />;
  }

  return (
    <section className="bg-white p-8 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">Your Dashboard</h2>
      <KPIsSection />
      <h2 className="text-3xl font-bold mb-6 text-blue-700 mt-12">
        Your Projects
      </h2>
      {projects.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-xl text-gray-600 mb-4">
            No projects found for your account.
          </p>
          <button
            onClick={addMockProjects}
            className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md"
          >
            Load Sample Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => navigateTo('projectDetail', project)}
            >
              <h3 className="text-xl font-semibold mb-2 text-blue-600">
                {project.projectName}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {project.packageType}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'In Progress'
                      ? 'bg-yellow-200 text-yellow-800'
                      : project.status === 'Completed'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {project.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('projectDetail', project);
                  }}
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// KPI Section Component
const KPIsSection = () => {
  const { db, userId, showMessage } = useContext(FirebaseContext);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userId) {
      setLoading(false);
      return;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const kpisCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/kpis`
    );
    const unsubscribe = onSnapshot(
      kpisCollectionRef,
      (snapshot) => {
        const kpisData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setKpis(kpisData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching KPIs:', error);
        showMessage(`Failed to load KPIs: ${error.message}`, 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId, showMessage]);

  const addMockKPIs = async () => {
    setLoading(true);
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const kpisCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/kpis`
    );
    try {
      const existingDocs = await getDocs(kpisCollectionRef);

      if (existingDocs.empty) {
        const mockKPIs = [
          {
            name: 'Monthly Revenue Growth',
            value: 12.5,
            unit: '%',
            trend: 'up',
            category: 'Financial',
            description:
              'Percentage increase in revenue compared to the previous month.',
          },
          {
            name: 'Customer Acquisition Cost (CAC)',
            value: 75,
            unit: '$',
            trend: 'down',
            category: 'Marketing',
            description: 'Average cost to acquire a new customer.',
          },
          {
            name: 'Operational Efficiency Score',
            value: 8.2,
            unit: '/10',
            trend: 'up',
            category: 'Operational',
            description: 'Internal score reflecting process efficiency.',
          },
          {
            name: 'Customer Retention Rate',
            value: 88,
            unit: '%',
            trend: 'stable',
            category: 'Customer',
            description: 'Percentage of customers retained over a period.',
          },
          {
            name: 'Website Conversion Rate',
            value: 3.1,
            unit: '%',
            trend: 'up',
            category: 'Marketing',
            description:
              'Percentage of website visitors who complete a desired action.',
          },
          {
            name: 'Average Project Completion Time',
            value: 45,
            unit: 'days',
            trend: 'down',
            category: 'Operational',
            description: 'Average number of days to complete a client project.',
          },
        ];

        for (const kpi of mockKPIs) {
          await addDoc(kpisCollectionRef, kpi);
        }
        showMessage('Mock KPIs added successfully!', 'success');
      } else {
        showMessage('KPIs already exist. Not adding mock data.', 'info');
      }
    } catch (error) {
      console.error('Error adding mock KPIs:', error);
      showMessage(`Failed to add mock KPIs: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner mb-8">
      <h3 className="text-2xl font-semibold mb-4 text-blue-600">
        Key Performance Indicators (KPIs)
      </h3>
      {kpis.length === 0 ? (
        <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-lg text-gray-600 mb-4">
            No KPI data available yet.
          </p>
          <button
            onClick={addMockKPIs}
            className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-300 ease-in-out shadow-md"
          >
            Load Sample KPIs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-white p-5 rounded-lg shadow-md border border-gray-200"
            >
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {kpi.name}
              </h4>
              <p className="text-3xl font-extrabold text-blue-700 mb-3">
                {kpi.value} {kpi.unit}
                <span className="ml-2 inline-block align-middle">
                  {kpi.trend === 'up' && (
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  )}
                  {kpi.trend === 'down' && (
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 112 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  )}
                  {kpi.trend === 'stable' && (
                    <svg
                      className="w-6 h-6 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-8a1 1 0 112 0 1 1 0 01-2 0zm7 0a1 1 0 112 0 1 1 0 01-2 0zm7 0a1 1 0 112 0 1 1 0 01-2 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  )}
                </span>
              </p>
              <p className="text-sm text-gray-600">{kpi.description}</p>
              <p className="text-xs text-gray-400 mt-2">
                Category: {kpi.category}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Project Detail Component
const ProjectDetail = ({ project, navigateTo }) => {
  const { db, userId, showMessage } = useContext(FirebaseContext);
  const [currentTab, setCurrentTab] = useState('overview');
  const [communications, setCommunications] = useState(
    project.communications || []
  );
  const [projectDocuments, setProjectDocuments] = useState(
    project.documents || []
  );

  useEffect(() => {
    if (!db || !userId || !project?.id) return;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    const projectDocRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/projects`,
      project.id
    );

    const unsubscribe = onSnapshot(
      projectDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCommunications(data.communications || []);
          setProjectDocuments(data.documents || []);
        }
      },
      (error) => {
        console.error('Error fetching project data:', error);
        showMessage(
          `Failed to load project details: ${error.message}`,
          'error'
        );
      }
    );

    return () => unsubscribe();
  }, [db, userId, project.id, showMessage]);

  const handleSendMessage = async (message, file) => {
    if (!message.trim() && !file) {
      showMessage('Message or file cannot be empty.', 'error');
      return;
    }
    if (!db || !userId || !project?.id) {
      showMessage('Error: Database or user ID not available.', 'error');
      return;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    let fileAttachment = null;
    if (file) {
      fileAttachment = {
        name: file.name,
        url: `https://placehold.co/600x400/CCCCCC/000000?text=Uploaded+File+${encodeURIComponent(
          file.name
        )}`,
        type: file.type,
        size: file.size,
      };
    }

    const newCommunication = {
      sender: 'Client',
      message: message,
      timestamp: new Date().toISOString(),
      attachment: fileAttachment,
    };

    const projectDocRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/projects`,
      project.id
    );
    try {
      const docSnap = await getDoc(projectDocRef);
      if (docSnap.exists()) {
        const currentCommunications = docSnap.data().communications || [];
        await updateDoc(projectDocRef, {
          communications: [...currentCommunications, newCommunication],
        });
        showMessage('Message sent successfully!', 'success');
      } else {
        showMessage('Project not found.', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showMessage(`Failed to send message: ${error.message}`, 'error');
    }
  };

  const handleUploadDocument = async (file) => {
    if (!file) {
      showMessage('No file selected for upload.', 'error');
      return;
    }
    if (!db || !userId || !project?.id) {
      showMessage('Error: Database or user ID not available.', 'error');
      return;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    let newDocument = {
      name: file.name,
      url: `https://placehold.co/600x400/ADD8E6/000000?text=Uploaded+Doc+${encodeURIComponent(
        file.name
      )}`,
      uploadedAt: new Date().toISOString(),
    };

    const projectDocRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/projects`,
      project.id
    );
    try {
      const docSnap = await getDoc(projectDocRef);
      if (docSnap.exists()) {
        const currentDocuments = docSnap.data().documents || [];
        await updateDoc(projectDocRef, {
          documents: [...currentDocuments, newDocument],
        });
        showMessage('Document uploaded successfully!', 'success');
      } else {
        showMessage('Project not found.', 'error');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showMessage(`Failed to upload document: ${error.message}`, 'error');
    }
  };

  return (
    <section className="bg-white p-8 rounded-lg shadow-xl">
      <button
        onClick={() => navigateTo('dashboard')}
        className="mb-6 px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-300 ease-in-out flex items-center"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Back to Dashboard
      </button>
      <h2 className="text-3xl font-bold mb-4 text-blue-700">
        {project.projectName}
      </h2>
      <p className="text-lg text-gray-600 mb-6">{project.packageType}</p>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setCurrentTab('overview')}
            className={`py-3 px-6 text-lg font-medium border-b-2 ${
              currentTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview & Milestones
          </button>
          <button
            onClick={() => setCurrentTab('deliverables')}
            className={`py-3 px-6 text-lg font-medium border-b-2 ${
              currentTab === 'deliverables'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deliverables
          </button>
          <button
            onClick={() => setCurrentTab('documents')}
            className={`py-3 px-6 text-lg font-medium border-b-2 ${
              currentTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setCurrentTab('communication')}
            className={`py-3 px-6 text-lg font-medium border-b-2 ${
              currentTab === 'communication'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Communication Log
          </button>
        </nav>
      </div>

      <div>
        {currentTab === 'overview' && <OverviewSection project={project} />}
        {currentTab === 'deliverables' && (
          <DeliverablesSection project={project} />
        )}
        {currentTab === 'documents' && (
          <DocumentsSection
            documents={projectDocuments}
            onUploadDocument={handleUploadDocument}
          />
        )}
        {currentTab === 'communication' && (
          <CommunicationSection
            communications={communications}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </section>
  );
};

const OverviewSection = ({ project }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-2xl font-semibold mb-4 text-blue-600">
        Project Status
      </h3>
      <p className="text-lg mb-4">
        Current Status:{' '}
        <span
          className={`font-bold ${
            project.status === 'In Progress'
              ? 'text-yellow-700'
              : project.status === 'Completed'
              ? 'text-green-700'
              : 'text-red-700'
          }`}
        >
          {project.status}
        </span>
      </p>

      <h3 className="text-2xl font-semibold mb-3 text-blue-600">Milestones</h3>
      {project.milestones && project.milestones.length > 0 ? (
        <ul className="list-disc list-inside space-y-2">
          {project.milestones.map((milestone, index) => (
            <li key={index} className="text-gray-700 flex items-center">
              {milestone.completed ? (
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-yellow-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
              {milestone.name} - {milestone.date}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">
          No milestones defined for this project yet.
        </p>
      )}
    </div>
  );
};

// Deliverables Section Component
const DeliverablesSection = ({ project }) => {
  const filteredDeliverables = project.deliverables.filter(
    (d) => d.packageType === project.packageType
  );

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-2xl font-semibold mb-4 text-blue-600">
        Key Deliverables
      </h3>
      {filteredDeliverables && filteredDeliverables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliverables.map((deliverable, index) => (
            <a
              key={index}
              href={deliverable.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-white flex items-center space-x-3"
            >
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <span className="text-blue-700 font-medium">
                {deliverable.name}
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          No specific deliverables listed for this package yet.
        </p>
      )}
    </div>
  );
};

// Documents Section Component
const DocumentsSection = ({ documents, onUploadDocument }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      onUploadDocument(selectedFile);
      setSelectedFile(null);
      document.getElementById('document-upload-input').value = '';
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-2xl font-semibold mb-4 text-blue-600">
        Project Documents
      </h3>
      <div className="mb-6 flex items-center space-x-3">
        <input
          id="document-upload-input"
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-blue-50 file:text-blue-700
                               hover:file:bg-blue-100"
        />
        <button
          onClick={handleUploadClick}
          disabled={!selectedFile}
          className={`px-6 py-2 rounded-full font-semibold shadow-md transition duration-300 ease-in-out
                                ${
                                  selectedFile
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                }`}
        >
          Upload Document
        </button>
      </div>
      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, index) => (
            <a
              key={index}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-white flex items-center space-x-3"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                ></path>
              </svg>
              <span className="text-gray-700 font-medium">{doc.name}</span>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          No general documents available for this project yet.
        </p>
      )}
    </div>
  );
};

// Communication Section Component
const CommunicationSection = ({ communications, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [communications]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSendClick = () => {
    onSendMessage(newMessage, selectedFile);
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner flex flex-col h-[500px]">
      <h3 className="text-2xl font-semibold mb-4 text-blue-600">
        Communication Log
      </h3>
      <div className="flex-grow overflow-y-auto p-3 border border-gray-200 rounded-lg bg-white mb-4 custom-scrollbar">
        {communications.length === 0 ? (
          <p className="text-gray-600 text-center py-10">
            No messages yet. Start a conversation!
          </p>
        ) : (
          communications.map((comm, index) => (
            <div
              key={index}
              className={`mb-3 p-3 rounded-lg max-w-[80%] ${
                comm.sender === 'Client'
                  ? 'bg-blue-100 self-end ml-auto text-right'
                  : 'bg-gray-100 self-start mr-auto text-left'
              }`}
            >
              <p className="font-semibold text-sm mb-1">{comm.sender}</p>
              <p className="text-gray-800">{comm.message}</p>
              {comm.attachment && (
                <a
                  href={comm.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm flex items-center mt-1 justify-end"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13.5"
                    ></path>
                  </svg>
                  {comm.attachment.name}
                </a>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(comm.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center space-x-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-300 ease-in-out shadow-md"
          title="Attach File"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13.5"
            ></path>
          </svg>
        </button>
        {selectedFile && (
          <span className="text-sm text-gray-600 truncate max-w-[150px]">
            {selectedFile.name}
          </span>
        )}
        <textarea
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows="3"
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        ></textarea>
        <button
          onClick={handleSendClick}
          disabled={!newMessage.trim() && !selectedFile}
          className={`px-6 py-3 rounded-lg font-semibold shadow-md transition duration-300 ease-in-out
                                ${
                                  newMessage.trim() || selectedFile
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// AccountInfo Component
const AccountInfo = () => {
  const { userId } = useContext(FirebaseContext);
  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-2xl font-semibold mb-4 text-blue-600">
        Account Information
      </h3>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-lg font-medium">
          User ID: <span className="font-mono text-gray-700">{userId}</span>
        </p>
        <p className="mt-4 text-sm text-gray-500">
          This is a simplified view. More account details would be displayed
          here.
        </p>
      </div>
    </div>
  );
};

// Support Component
const Support = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showMessage } = useContext(FirebaseContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      console.log('Support form submitted:', formData);
      setIsSubmitting(false);
      showMessage('Your support request has been submitted!', 'success');
      setFormData({ subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-2xl font-semibold mb-4 text-blue-600">
        Support Center
      </h3>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-lg text-gray-600 mb-4">
          Send us a message, and we'll get back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700"
            >
              Subject
            </label>
            <input
              type="text"
              name="subject"
              id="subject"
              value={formData.subject}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              name="message"
              id="message"
              rows="4"
              value={formData.message}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 rounded-md font-semibold text-white shadow-md transition duration-300 ease-in-out ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;