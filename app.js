// FIREBASE CONFIG
firebase.initializeApp({
    apiKey: "AIzaSyC5rz2xPu3k5eg0MVMv_oKXTpRuIun7aUU",
    authDomain: "student-management-23d15.firebaseapp.com",
    projectId: "student-management-23d15",
    storageBucket: "student-management-23d15.firebasestorage.app"
  });
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  let editingStudentId = null;
  let existingPhotoUrl = "";

  const dateOfEnterInput = document.getElementById("dateOfEnter");
  if(dateOfEnterInput && !dateOfEnterInput.value){
    const today = new Date().toISOString().split("T")[0];
    dateOfEnterInput.value = today;
  }

  if(typeof window.flatpickr === "function"){
    ["dob", "dateOfEnter", "admissionDate", "tcDate"].forEach((id) => {
      const el = document.getElementById(id);
      if(el){
        window.flatpickr(el, {
          dateFormat: "Y-m-d",
          allowInput: true
        });
      }
    });
  }

  function updateFeeBalance(){
    const feeEl = document.getElementById("fee");
    const paidEl = document.getElementById("feePaid");
    const balanceEl = document.getElementById("balance");
    if(!feeEl || !paidEl || !balanceEl){
      return;
    }
    const total = Number((feeEl.value || "").toString().replace(/[^\d.]/g, "")) || 0;
    const paid = Number((paidEl.value || "").toString().replace(/[^\d.]/g, "")) || 0;
    const balance = Math.max(total - paid, 0);
    balanceEl.value = balance ? String(balance) : (total || paid ? "0" : "");
  }

  const feeEl = document.getElementById("fee");
  const feePaidEl = document.getElementById("feePaid");
  if(feeEl){
    feeEl.addEventListener("input", updateFeeBalance);
  }
  if(feePaidEl){
    feePaidEl.addEventListener("input", updateFeeBalance);
  }

  (function initAdmissionEditMode(){
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if(!editId){
      return;
    }
    editingStudentId = editId;
    const saveBtn = document.querySelector(".save-btn");
    if(saveBtn){
      saveBtn.textContent = "Update Admission";
    }
    db.collection("students").doc(editId).get().then((doc) => {
      if(!doc.exists){
        return;
      }
      const d = doc.data() || {};
      existingPhotoUrl = d.photo || "";
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if(el){
          el.value = val || "";
        }
      };
      setVal("adm", d.adm);
      setVal("firstName", d.firstName);
      setVal("lastName", d.lastName);
      setVal("dob", d.dob);
      setVal("dateOfEnter", d.dateOfEnter);
      setVal("aadhaar", d.aadhaar);
      setVal("blood", d.blood);
      setVal("mobile", d.mobile);
      setVal("class", d.class);
      setVal("section", d.section);
      setVal("medium", d.medium);
      setVal("father", d.father);
      setVal("mother", d.mother);
      setVal("fatherStudy", d.fatherStudy);
      setVal("motherStudy", d.motherStudy);
      setVal("fatherOcc", d.fatherOcc);
      setVal("motherOcc", d.motherOcc);
      setVal("address", d.address);
      setVal("admissionDate", d.admissionDate);
      setVal("tcDate", d.tcDate);
      setVal("fee", d.fee);
      setVal("feePaid", d.feePaid);
      setVal("balance", d.balance);
      updateFeeBalance();
      document.querySelectorAll('input[name="gender"]').forEach((r) => {
        r.checked = r.value === d.gender;
      });
    });
  })();
  
  function showAuthMessage(message, isSuccess){
    const messageEl = document.getElementById("authMessage");
    if(!messageEl){
      alert(message);
      return;
    }
    messageEl.textContent = message;
    if(isSuccess){
      messageEl.classList.add("success");
    }else{
      messageEl.classList.remove("success");
    }
  }

  function getLoginInputs(){
    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");
    return {
      email: emailEl ? emailEl.value.trim() : "",
      password: passwordEl ? passwordEl.value : ""
    };
  }

  // LOGIN
  function login(){
    const { email, password } = getLoginInputs();
    if(!email || !password){
      showAuthMessage("Please enter email and password.", false);
      return;
    }
    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      showAuthMessage("Login successful.", true);
      window.location = "dashboard.html";
    })
    .catch((e) => {
      const rawMessage = String(e?.message || "");
      const normalizedMessage = rawMessage.toLowerCase();
      const errorCode = String(e?.code || "").toLowerCase();

      const isInvalidCredential =
        errorCode === "auth/user-not-found" ||
        errorCode === "auth/wrong-password" ||
        errorCode === "auth/invalid-credential" ||
        normalizedMessage.includes("invalid_login_credentials") ||
        normalizedMessage.includes("invalid credential") ||
        normalizedMessage.includes("wrong-password") ||
        normalizedMessage.includes("user-not-found");

      if(isInvalidCredential){
        showAuthMessage("Invalid email or password.", false);
        return;
      }
      showAuthMessage(e.message || "Unable to login right now.", false);
    });
  }
  
  function register(){
    const { email, password } = getLoginInputs();
    if(!email || !password){
      showAuthMessage("Please enter email and password to register.", false);
      return;
    }
    auth.createUserWithEmailAndPassword(email, password)
    .then(() => showAuthMessage("Registered successfully. Please login.", true))
    .catch((e) => {
      if(e.code === "auth/email-already-in-use"){
        showAuthMessage("This email is already registered. Please login.", false);
        return;
      }
      showAuthMessage(e.message || "Registration failed.", false);
    });
  }

  function forgotPassword(){
    const email = document.getElementById("email")?.value?.trim() || "";
    if(!email){
      showAuthMessage("Enter your email to receive OTP/reset link.", false);
      return;
    }
    auth.sendPasswordResetEmail(email)
    .then(() => {
      showAuthMessage("Reset mail sent in real-time. Check your inbox and spam.", true);
    })
    .catch((e) => {
      if(e.code === "auth/user-not-found"){
        showAuthMessage("No account found with this email. Register here first.", false);
        return;
      }
      showAuthMessage(e.message || "Could not send reset mail.", false);
    });
  }
  
  function logout(){
    auth.signOut().then(()=>window.location="index.html");
  }
  
  // SAVE
  async function saveData(){
    const admValue = document.getElementById("adm")?.value?.trim() || "";
    const firstName = document.getElementById("firstName")?.value?.trim() || "";
    const dobValue = document.getElementById("dob")?.value?.trim() || "";
    const aadhaarValue = (document.getElementById("aadhaar")?.value || "").trim();
    const mobileValue = (document.getElementById("mobile")?.value || "").trim();
    const feeValue = document.getElementById("fee")?.value || "";
    const feePaidValue = document.getElementById("feePaid")?.value || "";

    if(!admValue || !firstName || !dobValue || !aadhaarValue || !mobileValue){
      alert("Please fill mandatory fields: Admission No, Name, DOB, Aadhaar, Mobile.");
      return;
    }
    if(!/^\d{10}$/.test(mobileValue)){
      alert("Mobile number must be exactly 10 digits.");
      return;
    }
    if(!/^\d{12}$/.test(aadhaarValue)){
      alert("Aadhaar number must be exactly 12 digits.");
      return;
    }

    const file = document.getElementById("photo").files[0];
    let url = "";
    if(file){
      const ref = storage.ref("photos/"+Date.now());
      await ref.put(file);
      url = await ref.getDownloadURL();
    }
  
    const lastName = document.getElementById("lastName")?.value?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim() || (document.getElementById("name")?.value || "");

    const payload = {
      adm:admValue,
      firstName:firstName,
      lastName:lastName,
      name:fullName,
      gender:document.querySelector('input[name="gender"]:checked')?.value || "",
      dob:dobValue,
      dateOfEnter:document.getElementById("dateOfEnter")?.value || "",
      aadhaar:aadhaarValue,
      blood:document.getElementById("blood")?.value || "",
      mobile:mobileValue,
      class:document.getElementById("class").value || "",
      section:document.getElementById("section")?.value || "",
      medium:document.getElementById("medium")?.value || "",
      father:document.getElementById("father")?.value || "",
      mother:document.getElementById("mother")?.value || "",
      fatherStudy:document.getElementById("fatherStudy")?.value || "",
      motherStudy:document.getElementById("motherStudy")?.value || "",
      fatherOcc:document.getElementById("fatherOcc")?.value || "",
      motherOcc:document.getElementById("motherOcc")?.value || "",
      address:document.getElementById("address")?.value || "",
      admissionDate:document.getElementById("admissionDate")?.value || "",
      tcDate:document.getElementById("tcDate")?.value || "",
      fee:feeValue,
      feePaid:feePaidValue,
      balance:document.getElementById("balance")?.value || "",
      photo:url || existingPhotoUrl || ""
    };

    if(editingStudentId){
      await db.collection("students").doc(editingStudentId).update(payload);
      alert("Updated");
      window.location.href = "students.html";
      return;
    }
    await db.collection("students").add(payload);
  
    alert("Saved");
  }
  
  // LOAD
  function normalizeSearchValue(value){
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeDigits(value){
    return String(value || "").replace(/\D/g, "");
  }

  function loadStudents(){
    db.collection("students").get().then(snap=>{
      let html="";
      snap.forEach(doc=>{
        const d=doc.data();
        const displayName = d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "-";
        const photo = d.photo ? `<img src="${d.photo}" width="44" height="44" style="border-radius:6px;object-fit:cover;">` : "-";
        const totalFee = Number(d.fee || 0);
        const paidFee = Number(d.feePaid || 0);
        const balanceFee = d.balance !== undefined && d.balance !== "" ? d.balance : Math.max(totalFee - paidFee, 0);
        const normalizedClass = normalizeSearchValue(d.class);
        const normalizedSection = normalizeSearchValue(d.section);
        const normalizedAdm = normalizeSearchValue(d.adm);
        const admDigits = normalizeDigits(d.adm);

        html+=`
  <tr data-class="${normalizedClass}" data-section="${normalizedSection}" data-adm="${normalizedAdm}" data-adm-digits="${admDigits}">
  <td>${photo}</td>
  <td>${d.adm || "-"}</td>
  <td>${d.firstName || "-"}</td>
  <td>${d.lastName || "-"}</td>
  <td>${displayName}</td>
  <td>${d.gender || "-"}</td>
  <td>${d.dob || "-"}</td>
  <td>${d.dateOfEnter || "-"}</td>
  <td>${d.aadhaar || "-"}</td>
  <td>${d.blood || "-"}</td>
  <td>${d.father || "-"}</td>
  <td>${d.mother || "-"}</td>
  <td>${d.fatherStudy || "-"}</td>
  <td>${d.motherStudy || "-"}</td>
  <td>${d.fatherOcc || "-"}</td>
  <td>${d.motherOcc || "-"}</td>
  <td>${d.address || "-"}</td>
  <td>${d.class || "-"}</td>
  <td>${d.section || "-"}</td>
  <td>${d.medium || "-"}</td>
  <td>${d.mobile || "-"}</td>
  <td>${d.admissionDate || "-"}</td>
  <td>${d.tcDate || "-"}</td>
  <td>${d.fee || "-"}</td>
  <td>${d.feePaid || "-"}</td>
  <td>${balanceFee === 0 || balanceFee ? balanceFee : "-"}</td>
  <td>
    <button class="edit-btn" onclick="editStudent('${doc.id}')">Edit</button>
    <button class="delete-btn" onclick="del('${doc.id}')">Delete</button>
  </td>
  </tr>`;
      });
      document.getElementById("tableBody").innerHTML=html;
      searchStudents();
    });
  }

  function editStudent(id){
    window.location.href = "admissions.html?edit=" + encodeURIComponent(id);
  }
  
  // DELETE
  function del(id){
    db.collection("students").doc(id).delete().then(loadStudents);
  }
  
  // SEARCH
  function searchStudents(){
    const searchInput = document.getElementById("searchBox");
    if(!searchInput){
      return;
    }

    const rawQuery = searchInput.value || "";
    const normalizedTextQuery = normalizeSearchValue(rawQuery);
    const normalizedNumberQuery = normalizeDigits(rawQuery);
    const queryParts = normalizedTextQuery ? normalizedTextQuery.split(" ") : [];
    const isNumericOnlyQuery = normalizedTextQuery.length > 0 && normalizedTextQuery === normalizedNumberQuery;

    document.querySelectorAll("#tableBody tr").forEach((row) => {
      const rowClass = row.dataset.class || "";
      const rowSection = row.dataset.section || "";
      const rowAdm = row.dataset.adm || "";
      const rowAdmDigits = row.dataset.admDigits || "";

      if(!normalizedTextQuery){
        row.style.display = "";
        return;
      }

      let showRow = false;
      if(isNumericOnlyQuery){
        // Numeric query should match exact admission/class/section values.
        showRow =
          rowAdm === normalizedTextQuery ||
          rowAdmDigits === normalizedNumberQuery ||
          rowClass === normalizedTextQuery ||
          rowSection === normalizedTextQuery;
      }else{
        // Text query should match class/section terms only.
        const rowFields = [rowClass, rowSection, rowAdm];
        showRow = queryParts.every((part) => rowFields.some((field) => field === part));
      }

      row.style.display = showRow ? "" : "none";
    });
  }

  function getTextValue(id){
    return document.getElementById(id)?.value?.trim() || "-";
  }

  function escapeHtml(value){
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clearAdmissionForm(){
    const ids = [
      "adm","firstName","lastName","dob","dateOfEnter","aadhaar","blood","mobile",
      "class","section","medium","father","mother","fatherStudy","motherStudy",
      "fatherOcc","motherOcc","address","admissionDate","tcDate","fee","photo"
      ,"feePaid","balance"
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if(!el){
        return;
      }
      if(el.type === "file"){
        el.value = "";
      }else{
        el.value = "";
      }
    });
    document.querySelectorAll('input[name="gender"]').forEach((r) => {
      r.checked = false;
    });
  }

  function fileToDataUrl(file){
    return new Promise((resolve) => {
      if(!file){
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async function printAdmissionPDF(){
    const firstName = getTextValue("firstName");
    const lastName = getTextValue("lastName");
    const fullName = `${firstName === "-" ? "" : firstName} ${lastName === "-" ? "" : lastName}`.trim() || "-";
    const gender = document.querySelector('input[name="gender"]:checked')?.value || "-";
    const selectedPhoto = document.getElementById("photo")?.files?.[0];
    const photoDataUrl = await fileToDataUrl(selectedPhoto);
    const existingPhotoFromForm = existingPhotoUrl || "";
    const details = [
      ["Admission No", getTextValue("adm")],
      ["Student Name", fullName],
      ["Gender", gender],
      ["Date of Birth", getTextValue("dob")],
      ["Date of Enter", getTextValue("dateOfEnter")],
      ["Aadhaar No", getTextValue("aadhaar")],
      ["Blood Group", getTextValue("blood")],
      ["Mobile No", getTextValue("mobile")],
      ["Class", getTextValue("class")],
      ["Section", getTextValue("section")],
      ["Medium", getTextValue("medium")],
      ["Father Name", getTextValue("father")],
      ["Mother Name", getTextValue("mother")],
      ["Father Study", getTextValue("fatherStudy")],
      ["Mother Study", getTextValue("motherStudy")],
      ["Father Occupation", getTextValue("fatherOcc")],
      ["Mother Occupation", getTextValue("motherOcc")],
      ["Address", getTextValue("address")],
      ["Admission Date", getTextValue("admissionDate")],
      ["TC Issuing Date", getTextValue("tcDate")],
      ["Total Fee", getTextValue("fee")],
      ["Fee Paid", getTextValue("feePaid")],
      ["Balance", getTextValue("balance")]
    ];

    let rowHtml = "";
    for(let i = 0; i < details.length; i += 2){
      const left = details[i];
      const right = details[i + 1];
      rowHtml += `
        <tr>
          <td class="lbl">${escapeHtml(left[0])}</td>
          <td class="val">${escapeHtml(left[1])}</td>
          <td class="lbl">${right ? escapeHtml(right[0]) : ""}</td>
          <td class="val">${right ? escapeHtml(right[1]) : ""}</td>
        </tr>
      `;
    }
    const printablePhotoSrc = photoDataUrl || existingPhotoFromForm;
    const photoHtml = printablePhotoSrc
      ? `<img src="${printablePhotoSrc}" alt="Student Photo">`
      : `<div class="photo-placeholder">Student Photo</div>`;

    const printWin = window.open("", "_blank");
    printWin.document.write(`
      <html>
      <head>
        <title>Admission Form PDF</title>
        <style>
          @page{size:A4;margin:8mm;}
          body{font-family:"Segoe UI",Arial,sans-serif;padding:0;margin:0;background:#f2f7fb;color:#1a2f45;}
          .sheet{max-width:850px;margin:0 auto;background:#fff;border:1px solid #bfd5e5;border-radius:14px;overflow:hidden;}
          .top-band{height:10px;background:linear-gradient(90deg,#1f6796,#35a9c9);}
          .content{padding:12px;}
          .head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px;}
          .title-wrap{flex:1;text-align:center;}
          h1{margin:0;text-align:center;color:#164b70;font-size:24px;letter-spacing:.2px;}
          h2{margin:4px 0 0;text-align:center;font-size:14px;color:#466175;font-weight:600;}
          .meta{margin-top:6px;text-align:center;font-size:11px;color:#678195;}
          .photo-box{width:100px;height:118px;border:1px solid #9ab7cc;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f4f9fc;}
          .photo-box img{width:100%;height:100%;object-fit:cover;}
          .photo-placeholder{font-size:11px;color:#5b7386;text-align:center;padding:8px;}
          table{width:100%;border-collapse:collapse;font-size:12px;}
          td{border:1px solid #cfe0ec;padding:6px;vertical-align:top;}
          tr:nth-child(even) td{background:#fbfdff;}
          td.lbl{width:18%;background:#f2f8fc;font-weight:700;color:#214b67;}
          td.val{width:32%;}
          .sign-row{margin-top:24px;display:flex;justify-content:space-between;font-weight:700;}
          .sign-box{width:220px;text-align:center;color:#2a4a62;font-size:12px;}
          .line{border-top:1px solid #2c4d67;margin-top:24px;padding-top:6px;}
          .footer{margin-top:12px;text-align:center;font-size:10px;color:#6b8598;}
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="top-band"></div>
          <div class="content">
          <div class="head">
            <div style="width:100px;"></div>
            <div class="title-wrap">
              <h1>Cambridge EM School</h1>
              <h2>Student Admission Form</h2>
              <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
            </div>
            <div class="photo-box">${photoHtml}</div>
          </div>
          <table>${rowHtml}</table>
          <div class="sign-row">
            <div class="sign-box"><div class="line">Parent Signature</div></div>
            <div class="sign-box"><div class="line">Principal Signature</div></div>
          </div>
          <div class="footer">This is a system-generated admission print copy.</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();

    let finalized = false;
    const finishAndReturn = () => {
      if(finalized){
        return;
      }
      finalized = true;
      clearAdmissionForm();
      window.location.href = "dashboard.html";
    };

    printWin.onafterprint = () => {
      printWin.close();
      finishAndReturn();
    };

    const triggerPrint = () => {
      if(printWin.closed){
        finishAndReturn();
        return;
      }
      printWin.print();
    };

    const printImage = printWin.document.querySelector(".photo-box img");
    if(printImage){
      if(printImage.complete){
        triggerPrint();
      }else{
        const imgTimeout = setTimeout(triggerPrint, 2500);
        printImage.onload = () => {
          clearTimeout(imgTimeout);
          triggerPrint();
        };
        printImage.onerror = () => {
          clearTimeout(imgTimeout);
          triggerPrint();
        };
      }
    }else{
      triggerPrint();
    }

    // Fallback for browsers where onafterprint may not fire reliably.
    setTimeout(() => {
      if(!printWin.closed){
        printWin.close();
      }
      finishAndReturn();
    }, 4500);
  }
