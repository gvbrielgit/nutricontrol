
/* =========================================
   NUTRICONTROL - ARMAZENAMENTO
   Arquivo: js/storage.js
========================================= */

const Storage = {

    // Recupera informações salvas no navegador
    get(key) {

        try {

            const data = localStorage.getItem(key);

            // Se não existir informação, retorna uma lista vazia
            if (data === null) {
                return [];
            }

            return JSON.parse(data);

        } catch (error) {

            console.error("Erro ao recuperar dados:", error);

            return [];

        }

    },


    // Salva informações no navegador
    set(key, data) {

        try {

            localStorage.setItem(key, JSON.stringify(data));

            return true;

        } catch (error) {

            console.error("Erro ao salvar dados:", error);

            return false;

        }

    },


    // Remove informações armazenadas
    remove(key) {

        try {

            localStorage.removeItem(key);

            return true;

        } catch (error) {

            console.error("Erro ao remover dados:", error);

            return false;

        }

    },


    // Gera identificadores únicos
    generateId() {

        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {

            return crypto.randomUUID();

        }

        return (
            Date.now().toString(36) +
            Math.random().toString(36).substring(2, 10)
        );

    }

};
