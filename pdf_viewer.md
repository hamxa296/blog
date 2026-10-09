```markdown
# GIKI Chronicles — Automated PDF In-App Rendering Handover

## 1. Overview & System Architecture

This project renders PDF documents (Yearbooks, Institute Acts, Course Material, Guides) directly within the web app using an isolated **Mozilla PDF.js v4.4** viewer inside a responsive `iframe` modal (`src/components/PDFModal.tsx`). 

This setup replaces `react-pdf`, eliminating bundler crashes, canvas worker bloat, and external redirects to Google Drive.


```

┌────────────────────────────────────────────────────────┐
│                      Client Web App                    │
│                                                        │
│  [ Upload PDF ] ───────► Firebase Storage              │
│                              │                         │
│                              ▼                         │
│                    Generate `downloadURL`              │
│                              │                         │
│                              ▼                         │
│  [ Read Cards ] ◄─────── Save to Firestore             │
│        │                 (collection: "archives")      │
│        ▼                                               │
│  User Clicks Card                                      │
│        │                                               │
│        ▼                                               │
│  `PDFModal.tsx` (`iframe` -> `/pdfjs/web/viewer.html`) │
└────────────────────────────────────────────────────────┘

```

---

## 2. One-Time Firebase Configuration (Project Owner/Admin)

To permit Mozilla's PDF.js client to stream PDFs directly from Firebase Storage without browser CORS errors, the bucket owner must apply a CORS rule.

### A. Apply CORS to Storage Bucket
1. Open [Google Cloud Console](https://console.cloud.google.com/) and select the `giki-chronicles` project.
2. Open **Cloud Shell** (terminal icon in the top right nav bar).
3. Create `cors.json` by running:
   ```bash
   cat << 'EOF' > cors.json
   [
     {
       "origin": ["http://localhost:5173", "http://localhost:3000", "https://*.vercel.app"],
       "method": ["GET", "HEAD"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Range"]
     }
   ]
   EOF

```

*(Note: If a custom domain like `https://gikichronicles.com` is connected to Vercel, add it to the `"origin"` array).*

4. Apply the CORS policy to the project bucket:
```bash
gsutil cors set cors.json gs://giki-chronicles.firebasestorage.app

```


5. Confirm the settings:
```bash
gsutil cors get gs://giki-chronicles.firebasestorage.app

```



### B. Security Rules Checklist

#### Firebase Storage Rules (`Firebase Console > Storage > Rules`)

Ensure public read access is enabled so any visitor can stream the PDFs:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Restrict writes to authenticated users/admins
    }
  }
}

```

#### Cloud Firestore Rules (`Firebase Console > Firestore Database > Rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /archives/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

```

---

## 3. Frontend Implementation Pattern

### A. Standard Document Schema (Firestore)

Each document stored in the `archives` collection should follow this schema:

```typescript
interface ArchiveDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;       // Public Firebase download URL OR local path
  category: string;      // e.g., "Yearbook", "Official", "Guide"
  uploadedAt: Timestamp;
}

```

### B. Automated Upload Handler

Use this helper whenever an admin or user uploads a PDF:

```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebase";

export async function uploadArchiveDocument(file: File, title: string, description: string) {
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported.");
  }

  // 1. Upload raw binary to Firebase Storage
  const storagePath = `documents/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, file, { contentType: "application/pdf" });

  // 2. Obtain direct public HTTPS download URL
  const downloadUrl = await getDownloadURL(fileRef);

  // 3. Save entry to Firestore
  const docRef = await addDoc(collection(db, "archives"), {
    title,
    description,
    fileUrl: downloadUrl,
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, downloadUrl };
}

```

### C. Dynamic Rendering on the Archives Page (`src/pages/Archives.tsx`)

Render the list dynamically and wire the modal click handler:

```tsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import PDFModal from "../components/PDFModal";

export default function Archives() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [modalState, setModalState] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: "",
    title: "",
  });

  useEffect(() => {
    async function fetchDocuments() {
      const q = query(collection(db, "archives"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
    }
    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-2xl p-5 flex flex-col justify-between bg-zinc-900 border border-zinc-800">
            <div>
              <span className="text-xs uppercase tracking-wide text-zinc-400">Document</span>
              <h3 className="text-lg font-bold text-white mt-1">{doc.title}</h3>
              <p className="text-sm text-zinc-400 mt-2">{doc.description}</p>
            </div>
            <button
              onClick={() => setModalState({ isOpen: true, url: doc.fileUrl, title: doc.title })}
              className="mt-6 px-4 py-2 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition"
            >
              Open Archive
            </button>
          </div>
        ))}
      </div>

      <PDFModal isOpen="{modalState.isOpen}" onClose="{()"> setModalState({ ...modalState, isOpen: false })}
        fileUrl={modalState.url}
        title={modalState.title}
      />
    </div>
  );
}

```

---

## 4. Local Static Assets Fallback

For core institutional documents that never change and should load instantly without Firebase dependency:

* **GIKI Act 1994**: `public/documents/giki-act-1994.pdf`
* **Batch 32 Yearbook**: `public/documents/batch-32-yearbook.pdf`

These documents bypass CORS automatically because they are served from the app's root origin.

---

## 5. Verification Checklist

* [ ] Run `npm run build` and ensure bundle output contains no legacy `react-pdf` chunks.
* [ ] Open a Firebase Storage URL in `PDFModal` to verify the document loads without console CORS warnings.
* [ ] Confirm mobile layout does not clip the "Open Archive" buttons above the footer.
* [ ] Verify body scroll locking activates when `PDFModal` is mounted and restores when dismissed.

```

```