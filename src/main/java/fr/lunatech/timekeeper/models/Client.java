/*
 * Copyright 2020 Lunatech S.A.S
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package fr.lunatech.timekeeper.models;

import com.google.common.base.Objects;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;

@Entity
@Table(name = "clients", uniqueConstraints = {@UniqueConstraint(columnNames = {"name"})})
public class Client extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne
    @JoinColumn(name = "organization_id", nullable = false)
    @NotNull
    public Organization organization;

    @NotBlank
    public String name;

    @NotNull
    public String description;

    @OneToMany(mappedBy = "client")
    @NotNull
    public List<Project> projects;

    public Client() {
    }

    public Client(@NotBlank String name, @NotNull String description, @NotNull Organization organization, @NotNull List<Project> projects) {
        this.organization = organization;
        this.name = name;
        this.description = description;
        this.projects = projects;
    }

    @Override
    public String toString() {
        return "Client{" +
                "id=" + id +
                ", organization=" + organization.name+
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", nb of projects=" + projects.size() +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Client)) return false;
        Client client = (Client) o;
        return Objects.equal(id, client.id) &&
                Objects.equal(organization, client.organization) &&
                Objects.equal(name, client.name) &&
                Objects.equal(description, client.description) &&
                Objects.equal(projects, client.projects);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id, organization, name, description, projects);
    }
}
