package controladores;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author John Fredy Quiroz Gomez
 */
public class RegistrarServicio extends HttpServlet {

    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        procesar(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        procesar(request, response);
    }

    private void procesar(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("text/html;charset=UTF-8");

        String nombre = request.getParameter("nombre");
        String correo = request.getParameter("correo");
        String telefono = request.getParameter("telefono");
        String fecha = request.getParameter("fecha");
        String valor = request.getParameter("valor");
        String categoria = request.getParameter("categoria");
        String clave = request.getParameter("clave");
        String terminos = request.getParameter("terminos");

        List<String> errores = new ArrayList<>();

        if (nombre == null || nombre.trim().isEmpty()) {
            errores.add("El nombre del proveedor es obligatorio.");
        } else {
            nombre = nombre.trim();
            if (nombre.length() < 3 || nombre.length() > 40) {
                errores.add("El nombre debe tener entre 3 y 40 caracteres.");
            } else if (!nombre.matches("[A-Za-z ]+")) {
                errores.add("El nombre solo debe contener letras.");
            }
        }

        if (correo == null || correo.trim().isEmpty()) {
            errores.add("El correo electronico es obligatorio.");
        } else if (!correo.trim().matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            errores.add("El correo electronico no tiene un formato valido.");
        }

        if (telefono == null || telefono.trim().isEmpty()) {
            errores.add("El telefono es obligatorio.");
        } else if (!telefono.trim().matches("[0-9]{10}")) {
            errores.add("El telefono debe tener 10 digitos numericos.");
        }

        LocalDate fechaServicio = null;
        if (fecha == null || fecha.trim().isEmpty()) {
            errores.add("La fecha de inicio es obligatoria.");
        } else {
            try {
                fechaServicio = LocalDate.parse(fecha.trim());
                if (fechaServicio.isBefore(LocalDate.now())) {
                    errores.add("La fecha de inicio no puede ser anterior a hoy.");
                }
            } catch (DateTimeParseException e) {
                errores.add("La fecha de inicio no es una fecha valida.");
            }
        }

        Integer valorHora = null;
        if (valor == null || valor.trim().isEmpty()) {
            errores.add("El valor por hora es obligatorio.");
        } else {
            try {
                valorHora = Integer.valueOf(valor.trim());
                if (valorHora < 1000 || valorHora > 500000) {
                    errores.add("El valor por hora debe estar entre 1000 y 500000.");
                }
            } catch (NumberFormatException e) {
                errores.add("El valor por hora debe ser un numero.");
            }
        }

        if (categoria == null || categoria.trim().isEmpty()) {
            errores.add("Debe seleccionar una categoria.");
        } else if (!categoria.matches("plomeria|electricidad|aseo|carpinteria|pintura|mudanza")) {
            errores.add("La categoria seleccionada no es valida.");
        }

        if (clave == null || clave.isEmpty()) {
            errores.add("La clave es obligatoria.");
        } else if (clave.length() < 8 || clave.length() > 16) {
            errores.add("La clave debe tener entre 8 y 16 caracteres.");
        }

        if (terminos == null) {
            errores.add("Debe aceptar los terminos y condiciones.");
        }

        PrintWriter out = response.getWriter();
        out.println("<!DOCTYPE html>");
        out.println("<html lang=\"es\">");
        out.println("<head>");
        out.println("<meta charset=\"UTF-8\">");
        out.println("<title>Rental Service - Resultado</title>");
        out.println("<link rel=\"stylesheet\" href=\"styles.css\">");
        out.println("</head>");
        out.println("<body>");
        out.println("<header class=\"site-header\"><h1>Rental Service Marketplace</h1></header>");
        out.println("<main class=\"auth-container\">");
        out.println("<section class=\"form-side\"><article class=\"surface-card\">");

        if (errores.isEmpty()) {
            out.println("<h2>Servicio registrado</h2>");
            out.println("<p>El servicio de <strong>" + nombre + "</strong> fue registrado correctamente.</p>");
            out.println("<ul>");
            out.println("<li>Correo: " + correo + "</li>");
            out.println("<li>Telefono: " + telefono + "</li>");
            out.println("<li>Categoria: " + categoria + "</li>");
            out.println("<li>Fecha de inicio: " + fechaServicio + "</li>");
            out.println("<li>Valor por hora: " + valorHora + "</li>");
            out.println("</ul>");
        } else {
            out.println("<h2>No se pudo registrar el servicio</h2>");
            out.println("<p>Se encontraron " + errores.size() + " error(es) en los datos:</p>");
            out.println("<ul>");
            for (String error : errores) {
                out.println("<li>" + error + "</li>");
            }
            out.println("</ul>");
        }

        out.println("<p><a href=\"index.html\">Volver al formulario</a></p>");
        out.println("</article></section>");
        out.println("</main>");
        out.println("<footer class=\"site-footer\"><p>&copy; 2026 Rental Service Marketplace.</p></footer>");
        out.println("</body>");
        out.println("</html>");
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }
}
