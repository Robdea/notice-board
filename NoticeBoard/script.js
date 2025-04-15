const $ = (el) => document.querySelector(el) 
const $$ = (el) => document.querySelectorAll(el)

const container = $(".container");

let notes = JSON.parse(localStorage.getItem("notes")) || [];

function createIcon(iconName, className) {
    const icons ={
        xIcon: `
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class=${className}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>    
        `,
        plusIcon: `
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor"
            class=${className}
            >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>   
        `,
        warningIcon: `
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class=${className}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        `
    };

    return icons[iconName] || ""
}


function loadNotes() {
    for (const n of notes) {
        const note = makeNote(n.title, n.uid);

        n.cards.forEach(c => {
            const card = createCard(c.uid, c.titleCard);
            note.querySelector(".card-options").insertBefore(card, note.querySelector(".add-card"))
        });
        container.insertBefore(note, $(".note") )
    }
}

// add list
function createAddNoteUI() {
    const wrapper  = document.createElement("div");
    wrapper.classList.add("note");

    const addNoteBttn = document.createElement("button");
    addNoteBttn.classList.add("create-note");

    const plusIcon = createIcon("plusIcon", "add-icon");

    addNoteBttn.innerHTML = `
        ${plusIcon}            
        <p>Add another list</p>
    `;
    wrapper.appendChild(addNoteBttn);
    container.appendChild(wrapper);

    addNoteBttn.addEventListener("click", () => {
        showMakeNote(wrapper)
    })
}

function showMakeNote(wrapper) {
    const xIcon = createIcon("xIcon", "delete-icon");

    wrapper.innerHTML = `
        <div class="make-new-note">
            <input type="text" placeholder="Enter list title...">
            <div>
                <button class="confirm-note">Add to list</button>
                <button class="cancel-make-note">
                    ${xIcon}                
                </button>
            </div>
        </div>
    `;

    const input = wrapper.querySelector("input");

    wrapper.querySelector(".cancel-make-note").addEventListener("click", () => {
        wrapper.remove();
        createAddNoteUI();
    });

    wrapper.querySelector(".confirm-note").addEventListener("click", () =>{
        const title = input.value.trim();

        if(title !== ""){
            const safeTitle = escapeHTML(title)

            createNote(safeTitle);
            wrapper.remove();
            createAddNoteUI();
        }
    })

}
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text; // Esto automáticamente escapa el texto
    return div.innerHTML;
  }

function createNote(title) {
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const noteCreated = makeNote(title, uid); 
    
    container.insertBefore(noteCreated, container.lastElementChild);

    const noteJson = {uid, title, cards: []};
    saveNotes(noteJson);

}

function makeNote(title, uid) {
    const newNote = document.createElement("div"); 
    newNote.classList.add("new-note")

    newNote.id = uid

    const xIcon = createIcon("xIcon", "delete-icon");
    const plusIcon = createIcon("plusIcon", "icon");

    newNote.innerHTML = `
        <div class="info-note">
            <p class="title-note">${title}</p>
            <button class="edit-bttn">
                ${xIcon}
            </button>
        </div>
        <div class="card-options">
            <button class="add-card">
                ${plusIcon}
                <p>
                    Add a card
                </p>
            </button>
        </div>
    `
    
    const addCardBttn = newNote.querySelector(".add-card")
    const contOpts = newNote.querySelector(".card-options");

    const editBttn = newNote.querySelector(".edit-bttn")

    const titleNote = newNote.querySelector(".title-note")
    attachRenameBehavior(titleNote, uid);

    addCardBttn.addEventListener("click", () =>{
        showMakeCard(contOpts, uid)
    });
    
    editBttn.addEventListener("click", () =>{
        const modal = createModalEdit(title, uid);
        container.appendChild(modal);
        modal.showModal();
       
    });
    return newNote
}

function attachRenameBehavior(titleElement,uid) {
    titleElement.addEventListener("click", () => {
        const input = document.createElement("input");
        input.value = titleElement.textContent;
        input.classList.add("rename-opt");

        titleElement.replaceWith(input);

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const newTitle = escapeHTML(input.value.trim());
                if (newTitle !== "") {
                    const newP = document.createElement("p");
                    newP.textContent = newTitle;
                    newP.classList.add("title-note");

                    attachRenameBehavior(newP);
                    input.replaceWith(newP);
                    
                    const foundNote = notes.find(n => n.uid === uid );
                    foundNote.title = newTitle;
                    saveChanges();
                }
            }
        });
    });
}

function createModalEdit(title, uid) {
    const modal = document.createElement("dialog");
    
    modal.classList.add("modal")
    const warningIcon = createIcon("warningIcon", "warning-icon")

    modal.innerHTML = `
        ${warningIcon}
        <p>Are you sure you want to delete the note </p>
        <label>"${title}"</label>
        <section>
            <button class="accept-bttn">Accept</button>
            <button class="cancel-bttn">Cancel</button>
        </section>
    `;

    modal.querySelector(".accept-bttn").addEventListener("click", ()=>{
         const filterList = notes.filter(n => n.uid !== uid);
        
        localStorage.setItem("notes", JSON.stringify(filterList));
        document.getElementById(uid).remove();

        modal.remove();
    })
    
    modal.querySelector(".cancel-bttn").addEventListener("click", ()=>{
        modal.remove();
    })
    return modal;
}
//
function saveChanges() {
    localStorage.setItem("notes", JSON.stringify(notes))
}

function saveNotes(note) {
    notes.push(note);
    saveChanges();
}

// Card
function showMakeCard(cardContainer,uidNote) {
    const div = document.createElement("div");

    div.classList.add("make-note");

    const addCardButton = cardContainer.querySelector(".add-card");
    addCardButton.style.display = "none"; 

    const xIcon = createIcon("xIcon", "icon");


    div.innerHTML = `
        <textarea placeholder="Enter a title for this card..."></textarea>
        <section>
            <button class="add">Add card</button>
            <button class="cancel">
                ${xIcon}
            </button>
        </section>
    `;   
    cardContainer.appendChild(div);
        
    cardContainer.querySelector(".cancel").addEventListener("click", ()=>{
        div.remove();
        addCardButton.style.display = "flex"
    });
    
    cardContainer.querySelector(".add").addEventListener("click", ()=>{
        const titleCard = div.querySelector("textarea");
        const valueTitle = titleCard.value.trim();

        if(valueTitle !== ""){
            const safeTitle = escapeHTML(valueTitle);

            addCard(safeTitle, cardContainer,div, uidNote);
            cardContainer.appendChild(addCardButton)
            addCardButton.style.display = "flex"
        }
    });
}

function showOptsModal(title, originalElement, uid) {
    const modal = document.createElement("dialog");
    modal.classList.add("modal")

    modal.innerHTML = `
        <p class="title">${title}</p>
        <section>
            <button class="delete-bttn">Delete card</button>
            <button class="close-modal">Close</button>
        </section>
    `
    container.appendChild(modal);

    modal.querySelector(".close-modal").addEventListener("click", () =>{
        modal.close();
        modal.remove();
    })

    const elementTitle = modal.querySelector(".title"); 

    elementTitle.addEventListener("click", () =>{
        const renameInput = document.createElement("input");
        renameInput.value = title;
        renameInput.classList.add("rename-opt");

        elementTitle.replaceWith(renameInput);

        renameInput.addEventListener("keydown", (e) =>{
            if(e.key === "Enter"){
                const newTitle = renameInput.value.trim();
                
                if(newTitle !== ""){
                    const safeTitle = escapeHTML(newTitle)
                    
                    const titleElement = document.createElement("p");
                    
                    titleElement.textContent = safeTitle;
                    titleElement.classList.add("title");
                    renameInput.replaceWith(titleElement);
                    
                    if (originalElement) {
                        originalElement.textContent = safeTitle;
                    }
                    let foundCard;

                    for (const n of notes) {
                        foundCard = n.cards.find(c => c.uid === uid);
                        if (foundCard) break;
                    }
                    foundCard.titleCard = safeTitle;
                    saveChanges();
                }
            }
        })
    });

    modal.querySelector(".delete-bttn").addEventListener("click", () =>{
        document.getElementById(uid).remove();
        
        for (const n of notes) {
            const index = n.cards.findIndex(c => c.uid === uid);

            if(index !== -1) {
                n.cards.splice(index, 1);
                saveChanges();
            }
        }
        modal.remove();
    })
    return modal;
}

function addCard(title, container,div, uidNote) {
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const newCard = createCard(uid, title);
    
    container.insertBefore(newCard, div);
    container.appendChild(newCard);

    const dataCard={
        uid,
        titleCard: title
    };

    notes.map(note => {
        if(note.uid === uidNote){
            note.cards.push(dataCard);
        }
    });
    
    saveChanges();
    div.remove();
}

function createCard(uid, title) {
    const newCard = document.createElement("button");
    newCard.id = uid;
    newCard.classList.add("card");

    newCard.innerHTML = `
        <p>${title}</p>
    `;

    newCard.addEventListener("click", () =>{
        const modal = showOptsModal(title, newCard.querySelector("p"), uid);
        modal.showModal();
    });

    return newCard
}

createAddNoteUI();
loadNotes();