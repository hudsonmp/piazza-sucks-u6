import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function searchMaterials(query: string, courseId: string) {
  try {
    const response = await axios.post(`${API_URL}/api/search`, {
      query,
      course_id: courseId,
    });
    return response.data;
  } catch (error) {
    console.error('Error searching materials:', error);
    throw error;
  }
}

export async function chatWithAssistant(query: string, courseId: string, userId: string) {
  try {
    const response = await axios.post(`${API_URL}/api/chat`, {
      query,
      course_id: courseId,
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error chatting with assistant:', error);
    throw error;
  }
}

export async function getCourseMaterials(courseId: string, userId: string) {
  try {
    const response = await axios.get(`${API_URL}/api/courses/${courseId}/materials`, {
      params: { user_id: userId },
    });
    return response.data.materials;
  } catch (error) {
    console.error('Error getting course materials:', error);
    throw error;
  }
}

export async function getStudentCourses(userId: string) {
  try {
    const response = await axios.get(`${API_URL}/api/student/courses`, {
      params: { user_id: userId },
    });
    return response.data.courses;
  } catch (error) {
    console.error('Error getting student courses:', error);
    throw error;
  }
}

export async function getRecentQueries(userId: string, courseId: string) {
  try {
    const response = await axios.get(`${API_URL}/api/student/queries/recent`, {
      params: { user_id: userId, course_id: courseId },
    });
    return response.data.queries;
  } catch (error) {
    console.error('Error getting recent queries:', error);
    throw error;
  }
}

/**
 * Upload and process a course material for embedding
 * @param file The file to upload (syllabus, transcript, lecture notes, slideshow)
 * @param materialType Type of material ('syllabus', 'transcript', 'lecture_notes', 'slideshow')
 * @param courseId ID of the course this material belongs to
 * @param title Title of the material
 * @param description Optional description of the material
 * @returns Processing result
 */
export async function processCourseMaterial(
  file: File,
  materialType: string,
  courseId: string,
  title: string,
  description: string = ""
) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('material_type', materialType);
    formData.append('course_id', courseId);
    formData.append('title', title);
    formData.append('description', description);

    const response = await axios.post(`${API_URL}/api/materials/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error processing course material:', error);
    throw error;
  }
} 