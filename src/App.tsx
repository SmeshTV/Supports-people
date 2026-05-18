import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navbar from './components/layout/Navbar';
import AuthModal from './components/auth/AuthModal';
import HomePage from './pages/HomePage';
import SubjectsPage from './pages/SubjectsPage';
import SubjectPage from './pages/SubjectPage';
import TestPage from './pages/TestPage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/DashboardPage';
import BookmarksPage from './pages/BookmarksPage';
import ProfilePage from './pages/ProfilePage';
import DirectionsPage from './pages/DirectionsPage';
import DirectionPage from './pages/DirectionPage';
import SchoolEntSubjectsPage from './pages/SchoolEntSubjectsPage';
import SchoolEntTopicDetailPage from './pages/SchoolEntTopicDetailPage';
import SchoolHelperPage from './pages/SchoolHelperPage';
import SchoolHelperArticlePage from './pages/SchoolHelperArticlePage';
import UniversityCoursesPage from './pages/UniversityCoursesPage';
import UniversityDisciplinesPage from './pages/UniversityDisciplinesPage';
import UniversityAttestationsPage from './pages/UniversityAttestationsPage';
import UniversityExamPage from './pages/UniversityExamPage';
import ExamsPage from './pages/ExamsPage';
import TrashPage from './pages/TrashPage';
import SectionDetailPage from './pages/SectionDetailPage';
import FolderViewPage from './pages/FolderViewPage';
import AdminRoot from './pages/admin/AdminRoot';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminTestsPage from './pages/admin/AdminTestsPage';

export default function App() {
  const initAuthListener = useAuthStore((state) => state.initAuthListener);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  return (
    <BrowserRouter>
      <Navbar />
      <AuthModal />
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:id" element={<SubjectPage />} />
        
        <Route path="/directions" element={<DirectionsPage />} />
        <Route path="/directions/:type" element={<DirectionPage />} />
        
        <Route path="/school/ent" element={<SchoolEntSubjectsPage />} />
        <Route path="/school/ent/:subjectId" element={<SchoolEntSubjectsPage />} />
        <Route path="/school/ent/topic/:topicId" element={<SchoolEntTopicDetailPage />} />
        <Route path="/school/helper" element={<SchoolHelperPage />} />
        <Route path="/school/helper/:articleId" element={<SchoolHelperArticlePage />} />
        <Route path="/helper/:articleId" element={<SchoolHelperArticlePage />} />
        <Route path="/section/:sectionId" element={<SectionDetailPage />} />
        <Route path="/folder/:folderId" element={<FolderViewPage />} />
        
        <Route path="/university/courses" element={<UniversityCoursesPage />} />
        <Route path="/university/disciplines/:courseId" element={<UniversityDisciplinesPage />} />
        <Route path="/university/attestations/:disciplineId" element={<UniversityAttestationsPage />} />
        <Route path="/university/exam/:attestationId" element={<UniversityExamPage />} />
        
        <Route path="/courses" element={<UniversityCoursesPage />} />
        <Route path="/courses/:directionId" element={<UniversityCoursesPage />} />
        
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/:disciplineId" element={<ExamsPage />} />
        
        <Route path="/test/:id" element={<TestPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
        
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route path="/admin" element={<AdminRoot />} />
        <Route path="/admin/tests" element={<AdminTestsPage />} />
        <Route path="/admin/questions/:testId" element={<AdminQuestions />} />
        
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
