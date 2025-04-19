import { createClient } from "@supabase/supabase-js"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

// Use environment variables
const openaiApiKey = process.env.OPENAI_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || ""

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface Document {
  id: string
  content: string
  metadata: {
    title: string
    type: string
    courseId: string
    fileId: string
  }
}

// Function to create embeddings from document content
export async function createEmbeddings(documents: Document[]) {
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set")
  }

  try {
    // Initialize the OpenAI embeddings model
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: "text-embedding-ada-002", // Using Ada for cost efficiency
    })

    console.log(`Creating embeddings for ${documents.length} documents`)

    // Process each document
    for (const doc of documents) {
      // Generate embedding vector
      const embeddingVector = await embeddings.embedQuery(doc.content)

      // Store in Supabase
      const { error } = await supabaseAdmin.from("embeddings").insert({
        id: doc.id,
        content: doc.content,
        embedding: embeddingVector,
        metadata: doc.metadata,
      })

      if (error) {
        console.error(`Error storing embedding for document ${doc.id}:`, error)
      }
    }

    return { success: true, count: documents.length }
  } catch (error) {
    console.error("Error creating embeddings:", error)
    throw error
  }
}

// Function to perform semantic search
export async function semanticSearch(query: string, courseId: string, limit = 5) {
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set")
  }

  try {
    // Initialize the OpenAI embeddings model
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: "text-embedding-ada-002",
    })

    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(query)

    // Perform similarity search in Supabase
    const { data, error } = await supabaseAdmin.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Adjust as needed
      match_count: limit,
      course_id: courseId,
    })

    if (error) {
      console.error("Error performing semantic search:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in semantic search:", error)
    throw error
  }
}

// Function to process and chunk documents for embedding
export async function processDocuments(fileContent: string, metadata: any): Promise<Document[]> {
  // Use LangChain's text splitter for intelligent chunking
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  })

  const chunks = await textSplitter.splitText(fileContent)

  return chunks.map((chunk, index) => ({
    id: `${metadata.fileId}-chunk-${index}`,
    content: chunk,
    metadata: {
      ...metadata,
      chunkIndex: index,
    },
  }))
}

// Function to setup the necessary database structures for vector search
export async function setupVectorStore() {
  try {
    // Enable the pgvector extension
    const { error: extensionError } = await supabaseAdmin.rpc("enable_pgvector_extension")

    if (extensionError) {
      console.error("Error enabling pgvector extension:", extensionError)
    }

    // Create the embeddings table with vector support
    const { error: tableError } = await supabaseAdmin.rpc("create_embeddings_table")

    if (tableError) {
      console.error("Error creating embeddings table:", tableError)
    }

    // Create the vector search function
    const { error: functionError } = await supabaseAdmin.rpc("create_match_documents_function")

    if (functionError) {
      console.error("Error creating match_documents function:", functionError)
    }

    return {
      success: !extensionError && !tableError && !functionError,
      extensionEnabled: !extensionError,
      tableCreated: !tableError,
      functionCreated: !functionError,
    }
  } catch (error) {
    console.error("Error setting up vector store:", error)
    throw error
  }
}
